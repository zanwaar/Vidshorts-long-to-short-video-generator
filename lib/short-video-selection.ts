import { z } from "zod";

import { getArcjetErrorMessage, protectAiInput } from "@/lib/arcjet";
import type { CaptionCue } from "@/lib/deepgram";
import {
  shortVideoGenerationConfig,
  type ShortVideoAiProvider,
} from "@/lib/short-video-config";

const shortVideoSelectionClipSchema = z.object({
  title: z.string().trim().min(1).max(180),
  startTime: z.number().finite().min(0),
  endTime: z.number().finite().min(0),
  reason: z.string().trim().min(1).max(1_500),
  seoScore: z.number().int().min(0).max(100),
});

const shortVideoSelectionResponseSchema = z.object({
  clips: z
    .array(shortVideoSelectionClipSchema)
    .min(shortVideoGenerationConfig.candidateCount)
    .max(shortVideoGenerationConfig.candidateCount),
});

export type ShortVideoSelectionClip = z.infer<
  typeof shortVideoSelectionClipSchema
>;

export type ShortVideoSelectionResult = {
  provider: ShortVideoAiProvider;
  model: string;
  clips: ShortVideoSelectionClip[];
};

type SelectShortVideoMomentsInput = {
  clerkUserId: string;
  transcriptText: string;
  transcriptLanguage: string | null;
  duration: number | null;
  captionCues: CaptionCue[];
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const geminiResponseJsonSchema = {
  type: "object",
  properties: {
    clips: {
      type: "array",
      minItems: shortVideoGenerationConfig.candidateCount,
      maxItems: shortVideoGenerationConfig.candidateCount,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          startTime: { type: "number" },
          endTime: { type: "number" },
          reason: { type: "string" },
          seoScore: { type: "integer" },
        },
        required: ["title", "startTime", "endTime", "reason", "seoScore"],
      },
    },
  },
  required: ["clips"],
} as const;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function formatCueTime(seconds: number) {
  return seconds.toFixed(2);
}

function buildTimedTranscript(captionCues: CaptionCue[]) {
  return captionCues
    .map(
      (cue) =>
        `${formatCueTime(cue.start)} --> ${formatCueTime(cue.end)} | ${cue.text}`
    )
    .join("\n");
}

function buildSystemPrompt() {
  return [
    "You are a senior short-form video strategist.",
    "Return JSON only.",
    `Select exactly ${shortVideoGenerationConfig.candidateCount} high-engagement short video moments from the transcript.`,
    `Each moment must be between ${shortVideoGenerationConfig.minDurationSeconds} and ${shortVideoGenerationConfig.maxDurationSeconds} seconds.`,
    "Use only timestamps supported by the provided timed transcript.",
    "Prioritize self-contained hooks, emotional peaks, surprising insights, debates, strong storytelling turns, or practical value.",
    "Keep the selected clips materially different and avoid major overlap.",
    "Each reason must explain why the moment is engaging for a short video and why it can perform well for SEO/discovery.",
    "seoScore must be an integer from 0 to 100.",
  ].join(" ");
}

function buildUserPrompt(input: SelectShortVideoMomentsInput) {
  return [
    "Return a json object with this exact shape:",
    '{"clips":[{"title":"string","startTime":0,"endTime":45,"reason":"string","seoScore":88}]}',
    "",
    `Transcript language: ${input.transcriptLanguage ?? "unknown"}`,
    `Video duration: ${input.duration ? `${input.duration.toFixed(2)} seconds` : "unknown"}`,
    "",
    "Full transcript:",
    input.transcriptText,
    "",
    "Timed transcript cues:",
    buildTimedTranscript(input.captionCues),
  ].join("\n");
}

function buildPromptInjectionPayload(
  systemPrompt: string,
  userPrompt: string,
  maxLength = 20_000
) {
  return `${systemPrompt}\n\n${userPrompt}`.slice(0, maxLength);
}

function normalizeClips(
  clips: ShortVideoSelectionClip[],
  duration: number | null
) {
  const sortedClips = [...clips]
    .sort((left, right) => right.seoScore - left.seoScore)
    .map((clip) => ({
      ...clip,
      title: clip.title.trim(),
      reason: clip.reason.trim(),
      startTime: Number(clip.startTime.toFixed(2)),
      endTime: Number(clip.endTime.toFixed(2)),
    }));

  const seenWindows = new Set<string>();

  for (const clip of sortedClips) {
    if (clip.endTime <= clip.startTime) {
      throw new Error("AI returned a clip whose end time is not after start time.");
    }

    const clipDuration = clip.endTime - clip.startTime;

    if (clipDuration < shortVideoGenerationConfig.minDurationSeconds) {
      throw new Error("AI returned a clip shorter than the configured minimum.");
    }

    if (clipDuration > shortVideoGenerationConfig.maxDurationSeconds) {
      throw new Error("AI returned a clip longer than the configured maximum.");
    }

    if (duration !== null && clip.endTime > duration + 0.5) {
      throw new Error("AI returned a clip that exceeds the video duration.");
    }

    const windowKey = `${clip.startTime}:${clip.endTime}`;

    if (seenWindows.has(windowKey)) {
      throw new Error("AI returned duplicate clip windows.");
    }

    seenWindows.add(windowKey);
  }

  return sortedClips;
}

async function requestDeepSeekJson(systemPrompt: string, userPrompt: string) {
  const apiKey = getRequiredEnv("DEEPSEEK_API_KEY");
  const model = shortVideoGenerationConfig.models.deepseek;
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: shortVideoGenerationConfig.maxOutputTokens,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`DeepSeek short selection failed: ${errorText.slice(0, 500)}`);
  }

  const payload = (await response.json()) as DeepSeekResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek short selection returned an empty response.");
  }

  return {
    model,
    content,
  };
}

async function requestGeminiJson(systemPrompt: string, userPrompt: string) {
  const apiKey = getRequiredEnv("GEMINI_API_KEY");
  const model = shortVideoGenerationConfig.models.gemini;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: geminiResponseJsonSchema,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Gemini short selection failed: ${errorText.slice(0, 500)}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const content = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini short selection returned an empty response.");
  }

  return {
    model,
    content,
  };
}

export async function selectShortVideoMoments(
  input: SelectShortVideoMomentsInput
): Promise<ShortVideoSelectionResult> {
  if (
    shortVideoGenerationConfig.candidateCount < 4 ||
    shortVideoGenerationConfig.candidateCount > 10
  ) {
    throw new Error("shortVideoGenerationConfig.candidateCount must stay between 4 and 10.");
  }

  if (!input.transcriptText.trim()) {
    throw new Error("Transcript text is required before selecting short videos.");
  }

  if (input.captionCues.length === 0) {
    throw new Error("Caption cues are required before selecting short videos.");
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);
  const promptInspectionDecision = await protectAiInput({
    clerkUserId: input.clerkUserId,
    prompt: buildPromptInjectionPayload(systemPrompt, userPrompt),
  });

  if (promptInspectionDecision.isDenied()) {
    throw new Error(
      getArcjetErrorMessage(
        promptInspectionDecision,
        "AI input blocked by security policy."
      )
    );
  }

  const provider = shortVideoGenerationConfig.provider;

  const aiResponse =
    provider === "deepseek"
      ? await requestDeepSeekJson(systemPrompt, userPrompt)
      : await requestGeminiJson(systemPrompt, userPrompt);

  const parsedResponse = shortVideoSelectionResponseSchema.parse(
    JSON.parse(aiResponse.content)
  );

  return {
    provider,
    model: aiResponse.model,
    clips: normalizeClips(parsedResponse.clips, input.duration),
  };
}
