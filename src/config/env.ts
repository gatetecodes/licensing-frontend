import { z } from "zod";

const envSchema = z
  .object({
    VITE_API_BASE_URL: z.string().url(),
    VITE_API_TIMEOUT_MS: z.string().regex(/^\d+$/).optional(),
    VITE_APP_NAME: z.string().optional(),
  })
  .transform((raw) => ({
    apiBaseUrl: raw.VITE_API_BASE_URL,
    apiTimeoutMs: raw.VITE_API_TIMEOUT_MS
      ? Number(raw.VITE_API_TIMEOUT_MS)
      : 15000,
    appName: raw.VITE_APP_NAME ?? "BNR Licensing Portal",
  }));

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  const errorMessage = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid frontend environment configuration: ${errorMessage}`);
}

export const env = Object.freeze(parsedEnv.data);
