import { describe, it, expect, beforeEach } from 'vitest';
import { validateEnvironment, resetEnvironmentCache } from './env';

describe('Environment Validation', () => {
  beforeEach(() => {
    resetEnvironmentCache();
  });

  it('validates required environment variables', () => {
    // Mock environment for this test
    const originalEnv = process.env;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    try {
      const env = validateEnvironment();
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-key');
    } finally {
      process.env = originalEnv;
    }
  });

  it('throws error when required variables are missing', () => {
    const originalEnv = process.env;
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

    try {
      expect(() => {
        validateEnvironment();
      }).toThrow();
    } finally {
      process.env = originalEnv;
    }
  });

  it('uses default NEXT_PUBLIC_APP_URL', () => {
    const originalEnv = process.env;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    delete process.env.NEXT_PUBLIC_APP_URL;

    try {
      const env = validateEnvironment();
      expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    } finally {
      process.env = originalEnv;
    }
  });
});
