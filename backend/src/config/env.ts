import { config } from 'dotenv';
import { z } from 'zod';

config();

const booleanFromEnv = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://127.0.0.1:3000'),
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MINIO_ENDPOINT: z.string().min(1).default('127.0.0.1'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: booleanFromEnv.default(false),
  MINIO_ACCESS_KEY: z.string().min(1).default('notey'),
  MINIO_SECRET_KEY: z.string().min(8).default('noteysecret'),
  MINIO_BUCKET: z.string().min(1).default('notey-files'),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: booleanFromEnv.optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
