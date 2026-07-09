import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  PYTHON_QRCODE_PATH: z.string().optional()
});

export const env = envSchema.parse(process.env);
