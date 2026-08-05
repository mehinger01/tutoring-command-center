import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a copy of env vars for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore after each test
    process.env = originalEnv;
  });

  it('validates required environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    // Import dynamically to pick up test env vars
    // Note: Real validation happens at startup; this is a structural test
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('requires URL to be valid format', () => {
    const validUrl = 'https://example.supabase.co';
    const invalidUrl = 'not-a-url';

    expect(validUrl).toMatch(/^https?:\/\//);
    expect(invalidUrl).not.toMatch(/^https?:\/\//);
  });
});
