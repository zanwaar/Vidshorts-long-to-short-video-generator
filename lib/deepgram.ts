type DeepgramWord = {
  word?: string;
  punctuated_word?: string;
  start?: number;
  end?: number;
  speaker?: number;
};

type DeepgramUtterance = {
  id?: string;
  start?: number;
  end?: number;
  speaker?: number;
  transcript?: string;
  words?: DeepgramWord[];
};

type DeepgramAlternative = {
  transcript?: string;
  paragraphs?: {
    transcript?: string;
    paragraphs?: Array<{
      sentences?: Array<{
        text?: string;
      }>;
    }>;
  };
  utterances?: DeepgramUtterance[];
};

type DeepgramChannel = {
  alternatives?: DeepgramAlternative[];
  detected_language?: string;
  languages?: string[];
};

export type DeepgramListenResponse = {
  metadata?: {
    request_id?: string;
    duration?: number;
  };
  results?: {
    utterances?: DeepgramUtterance[];
    channels?: DeepgramChannel[];
  };
};

export type CaptionCue = {
  index: number;
  start: number;
  end: number;
  text: string;
  speaker: number | null;
};

export type DeepgramTranscriptResult = {
  rawResponse: DeepgramListenResponse;
  fullText: string;
  language: string | null;
  duration: number | null;
  captions: {
    cues: CaptionCue[];
    srt: string;
    vtt: string;
  };
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getDeepgramModel() {
  return process.env.DEEPGRAM_MODEL?.trim() || "nova-3";
}

function formatVttTimestamp(seconds: number) {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0"),
  ].join(":") + `.${String(milliseconds).padStart(3, "0")}`;
}

function formatSrtTimestamp(seconds: number) {
  return formatVttTimestamp(seconds).replace(".", ",");
}

function normalizeCaptionText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildCaptionCues(response: DeepgramListenResponse) {
  const channel = response.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const utterances = response.results?.utterances ?? alternative?.utterances ?? [];
  const cues = utterances
    .map((utterance, index) => {
      const text = normalizeCaptionText(utterance.transcript ?? "");
      const start = typeof utterance.start === "number" ? utterance.start : null;
      const end = typeof utterance.end === "number" ? utterance.end : null;

      if (!text || start === null || end === null || end <= start) {
        return null;
      }

      return {
        index: index + 1,
        start,
        end,
        text,
        speaker: typeof utterance.speaker === "number" ? utterance.speaker : null,
      } satisfies CaptionCue;
    })
    .filter((cue): cue is CaptionCue => cue !== null);

  if (cues.length > 0) {
    return cues;
  }

  const transcript = normalizeCaptionText(alternative?.transcript ?? "");

  if (!transcript) {
    return [];
  }

  const duration =
    response.metadata?.duration && response.metadata.duration > 0
      ? response.metadata.duration
      : 5;

  return [
    {
      index: 1,
      start: 0,
      end: duration,
      text: transcript,
      speaker: null,
    },
  ] satisfies CaptionCue[];
}

function buildSrt(cues: CaptionCue[]) {
  return cues
    .map(
      (cue) =>
        `${cue.index}\n${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(
          cue.end
        )}\n${cue.text}`
    )
    .join("\n\n");
}

function buildVtt(cues: CaptionCue[]) {
  const body = cues
    .map(
      (cue) =>
        `${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}\n${cue.text}`
    )
    .join("\n\n");

  return `WEBVTT\n\n${body}`;
}

function extractTranscript(response: DeepgramListenResponse) {
  const channel = response.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  return normalizeCaptionText(alternative?.transcript ?? "");
}

function extractLanguage(response: DeepgramListenResponse) {
  const channel = response.results?.channels?.[0];

  return channel?.detected_language ?? channel?.languages?.[0] ?? null;
}

type DeepgramFetchBodyInput =
  | {
      body: string;
      contentType: "application/json";
    }
  | {
      body: ReadableStream<Uint8Array>;
      contentType: string;
    };

type NodeRequestInit = RequestInit & {
  duplex?: "half";
};

async function requestDeepgram(input: DeepgramFetchBodyInput) {
  const apiKey = getRequiredEnv("DEEPGRAM_API_KEY");
  const url = new URL("https://api.deepgram.com/v1/listen");

  url.searchParams.set("model", getDeepgramModel());
  url.searchParams.set("smart_format", "true");
  url.searchParams.set("punctuate", "true");
  url.searchParams.set("utterances", "true");
  url.searchParams.set("diarize", "true");
  url.searchParams.set("paragraphs", "true");
  url.searchParams.set("detect_language", "true");

  const requestInit: NodeRequestInit = {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": input.contentType,
    },
    body: input.body,
    duplex: typeof input.body === "string" ? undefined : "half",
  };

  return fetch(url, requestInit as RequestInit);
}

async function parseDeepgramTranscriptResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Deepgram transcription failed: ${errorText.slice(0, 500)}`);
  }

  const rawResponse = (await response.json()) as DeepgramListenResponse;
  const fullText = extractTranscript(rawResponse);
  const cues = buildCaptionCues(rawResponse);

  return {
    rawResponse,
    fullText,
    language: extractLanguage(rawResponse),
    duration:
      typeof rawResponse.metadata?.duration === "number"
        ? rawResponse.metadata.duration
        : null,
    captions: {
      cues,
      srt: buildSrt(cues),
      vtt: buildVtt(cues),
    },
  } satisfies DeepgramTranscriptResult;
}

export async function transcribeVideoFromUrl(input: { url: string }) {
  const response = await requestDeepgram({
    body: JSON.stringify({
      url: input.url,
    }),
    contentType: "application/json",
  });

  return parseDeepgramTranscriptResponse(response);
}

export async function transcribeVideoFromStream(input: {
  body: ReadableStream<Uint8Array>;
  contentType?: string | null;
}) {
  const response = await requestDeepgram({
    body: input.body,
    contentType: input.contentType?.trim() || "application/octet-stream",
  });

  return parseDeepgramTranscriptResponse(response);
}
