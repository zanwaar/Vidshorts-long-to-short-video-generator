export type ShortVideoAiProvider = "deepseek" | "gemini";

export const shortVideoGenerationConfig = {
  candidateCount: 5,
  minDurationSeconds: 30,
  maxDurationSeconds: 90,
  provider: "deepseek" as ShortVideoAiProvider,
  models: {
    deepseek: "deepseek-v4-pro",
    gemini: "gemini-3-flash-preview",
  },
  maxOutputTokens: 4_096,
} as const;
