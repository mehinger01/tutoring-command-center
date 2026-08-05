import { z } from 'zod';

const EnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Missing Supabase anon key'),
});

type Environment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(): Environment {
  const result = EnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const errors = result.error.flatten();
    const messages = Object.entries(errors.fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return result.data;
}

export const environment = validateEnvironment();
