import arcjet, {
  detectBot,
  detectPromptInjection,
  fixedWindow,
  request,
  shield,
  type ArcjetDecision,
} from "@arcjet/next";

const arcjetKey = process.env.ARCJET_KEY;

if (!arcjetKey) {
  throw new Error("ARCJET_KEY is required to enable Arcjet protections");
}

const allowedBots = ["CATEGORY:SEARCH_ENGINE"] as const;

function createBaseRules() {
  return [
    shield({
      mode: "LIVE",
    }),
  ];
}

function createPublicRequestRules() {
  return [
    ...createBaseRules(),
    detectBot({
      mode: "LIVE",
      allow: [...allowedBots],
    }),
  ];
}

export const middlewareArcjet = arcjet({
  key: arcjetKey,
  rules: createPublicRequestRules(),
});

export const uploadActionArcjet = arcjet({
  key: arcjetKey,
  rules: [
    ...createPublicRequestRules(),
    fixedWindow({
      mode: "LIVE",
      characteristics: ["userId"],
      window: "10m",
      max: 4,
    }),
  ],
});

export const analysisActionArcjet = arcjet({
  key: arcjetKey,
  rules: [
    ...createPublicRequestRules(),
    fixedWindow({
      mode: "LIVE",
      characteristics: ["userId"],
      window: "15m",
      max: 6,
    }),
  ],
});

export const aiInputArcjet = arcjet({
  key: arcjetKey,
  rules: [
    ...createBaseRules(),
    detectPromptInjection({
      mode: "LIVE",
    }),
  ],
});

export async function protectUploadActionRequest(userId: string) {
  const req = await request();
  return uploadActionArcjet.protect(req, { userId });
}

export async function protectAnalysisActionRequest(userId: string) {
  const req = await request();
  return analysisActionArcjet.protect(req, { userId });
}

export async function protectAiInput(options: {
  clerkUserId: string;
  prompt: string;
}) {
  const req = new Request("https://internal.vidshorts.local/ai/short-video-selection", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "vidshorts-inngest/1.0",
    },
  });

  return aiInputArcjet.protect(req, {
    userId: options.clerkUserId,
    detectPromptInjectionMessage: options.prompt,
  });
}

export function getArcjetErrorMessage(
  decision: ArcjetDecision,
  fallbackMessage = "Request blocked by security policy."
) {
  if (decision.reason.isRateLimit()) {
    return "Too many requests. Please wait before trying again.";
  }

  if (decision.reason.isBot()) {
    return "Automated clients are not allowed for this action.";
  }

  if (decision.reason.isPromptInjection()) {
    return "Prompt injection detected in the AI input. Please change the source content and try again.";
  }

  if (decision.reason.isShield()) {
    return "Request blocked because it matched a security protection rule.";
  }

  return fallbackMessage;
}
