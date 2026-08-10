import { z } from 'zod';

const EnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .describe('Supabase project URL (public, safe to expose)'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Missing Supabase anon key')
    .describe('Supabase anonymous key (public, safe to expose)'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Invalid app URL')
    .optional()
    .default('http://localhost:3000')
    .describe('Application root URL for auth redirects'),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

let validatedEnv: Environment | null = null;

export function validateEnvironment(): Environment {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = EnvironmentSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const errors = result.error.flatten();
    const messages = Object.entries(errors.fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

// Only validate on actual application startup, not on module import
// This is called from specific app entry points
export function getEnvironment(): Environment {
  return validateEnvironment();
}

// Reset cache for testing
export function resetEnvironmentCache(): void {
  validatedEnv = null;
}
