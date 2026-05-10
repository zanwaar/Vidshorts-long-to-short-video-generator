export type ShortVideoAiProvider = "deepseek" | "gemini";

function resolveShortVideoAiProvider(): ShortVideoAiProvider {
  const provider = process.env.SHORT_VIDEO_AI_PROVIDER?.trim().toLowerCase();

  if (!provider) {
    return "deepseek";
  }

  if (provider === "deepseek" || provider === "gemini") {
    return provider;
  }

  throw new Error(
    "SHORT_VIDEO_AI_PROVIDER must be either 'deepseek' or 'gemini'."
  );
}

export const shortVideoGenerationConfig = {
  candidateCount: 5,
  minDurationSeconds: 30,
  maxDurationSeconds: 90,
  provider: resolveShortVideoAiProvider(),
  models: {
    deepseek: "deepseek-chat",
    gemini: "gemini-3-flash-preview",
  },
  maxOutputTokens: 4_096,
} as const;
