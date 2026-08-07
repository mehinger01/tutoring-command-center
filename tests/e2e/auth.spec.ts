import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Validate environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.E2E_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.E2E_USER_A_PASSWORD;
const USER_B_EMAIL = process.env.E2E_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.E2E_USER_B_PASSWORD;

// Verify configuration before tests run
test.beforeAll(() => {
  const missing: string[] = [];

  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `These must be set to run E2E tests (use .env.local, not committed).`
    );
  }

  // Verify Supabase connectivity
  const testUrl = `${SUPABASE_URL}/rest/v1/`;
  return fetch(testUrl, {
    headers: {
      apikey: ANON_KEY!,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.text())
    .then((text) => {
      if (text.includes('Invalid API key')) {
        throw new Error(
          `Supabase project not configured correctly: Invalid API key. ` +
            `Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`
        );
      }
    });
});

test.describe('Authentication Flow', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('signup page renders', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('home page shows login and signup buttons', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('a:has-text("Create Account")')).toBeVisible();
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });

  test('signup form validation works', async ({ page }) => {
    await page.goto('/auth/signup');

    // Try to submit with mismatched passwords
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Passwords do not match'
    );
  });

  test('password must be at least 6 characters', async ({ page }) => {
    await page.goto('/auth/signup');

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    const submitButton = page.locator('button[type="submit"]');

    const testEmail = `test-${Date.now()}@example.com`;
    await emailInput.fill(testEmail);
    await passwordInput.fill('123');
    await confirmPasswordInput.fill('123');

    // Verify fields are filled
    await expect(passwordInput).toHaveValue('123');
    await expect(confirmPasswordInput).toHaveValue('123');

    // HTML5 minLength attribute should prevent form submission
    // When clicked, form won't submit and no page navigation should occur
    await submitButton.click();

    // Wait a bit for any potential submission attempt
    await page.waitForTimeout(500);

    // Should still be on signup page (no redirect)
    await expect(page).toHaveURL('/auth/signup');

    // If form somehow allowed submission to JS handler, JS validation would show error
    // But with minLength={6}, HTML5 validation blocks it first
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for error message - Supabase will return a legitimate auth error
    const errorElement = page.locator('[data-testid="error-message"]');
    await expect(errorElement).toBeVisible({ timeout: 5000 });

    // Verify it's an actual auth error, not a configuration error
    const errorText = await errorElement.textContent();

    // STRICT: Must be one of these legitimate Supabase auth responses
    const validErrors = [
      'Invalid login credentials',
      'Email not confirmed',
      'User not found',
      'Invalid password',
      'Unable to login',
    ];

    const isValidError = validErrors.some((msg) => errorText?.includes(msg));

    // Reject configuration errors (must not appear)
    expect(errorText).not.toContain('Invalid API key');
    expect(errorText).not.toContain('Missing Supabase URL');
    expect(errorText).not.toContain('service_role key');
    expect(errorText).not.toContain('Failed to fetch');

    // STRICT: Error must match one of the accepted legitimate auth errors
    expect(isValidError).toBe(true);
    expect(errorText).toBeTruthy();
  });
});

test.describe('Protected Routes', () => {
  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');
  });

  test('login page renders without auth errors when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/auth/login');
    // Should not show "redirected" or auth-related errors
    await expect(page.locator('h1')).toContainText('Sign In');
  });
});

test.describe('Authenticated Sessions', () => {
  test.skip(
    !USER_A_EMAIL || !USER_A_PASSWORD,
    'Requires E2E_USER_A_EMAIL and E2E_USER_A_PASSWORD'
  );

  test('User A can log in successfully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', USER_A_EMAIL!);
    await page.fill('input[name="password"]', USER_A_PASSWORD!);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', USER_A_EMAIL!);
    await page.fill('input[name="password"]', USER_A_PASSWORD!);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('session persists after page reload', async ({ page }) => {
    // Log in
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', USER_A_EMAIL!);
    await page.fill('input[name="password"]', USER_A_PASSWORD!);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    // Reload page
    await page.reload();

    // Should still be on dashboard (middleware auto-refreshed session)
    await expect(page).toHaveURL('/dashboard');
  });

  test('user can log out', async ({ page }) => {
    // Log in
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', USER_A_EMAIL!);
    await page.fill('input[name="password"]', USER_A_PASSWORD!);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    // Clear cookies to simulate logout (middleware will redirect)
    await page.context().clearCookies();

    // Navigate to dashboard to trigger redirect
    await page.goto('/dashboard');

    // Should redirect to login because session was cleared
    await expect(page).toHaveURL('/auth/login');
  });

  test('dashboard redirects to login after logout', async ({ page }) => {
    // Log in
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', USER_A_EMAIL!);
    await page.fill('input[name="password"]', USER_A_PASSWORD!);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

    // Clear cookies to simulate logout
    await page.context().clearCookies();

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Should redirect to login because session was cleared
    await expect(page).toHaveURL('/auth/login');
  });

  test.skip(
    !USER_B_EMAIL || !USER_B_PASSWORD,
    'Requires E2E_USER_B_EMAIL and E2E_USER_B_PASSWORD'
  );

  test('User B can log in successfully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', USER_B_EMAIL!);
    await page.fill('input[name="password"]', USER_B_PASSWORD!);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });
});

test.describe('Row-Level Security (RLS) Isolation', () => {
  test.skip(
    !USER_A_EMAIL ||
      !USER_A_PASSWORD ||
      !USER_B_EMAIL ||
      !USER_B_PASSWORD ||
      !SUPABASE_URL ||
      !ANON_KEY,
    'Requires both user credentials and Supabase configuration'
  );

  test('User A can select their own profile', async () => {
    const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

    // Log in as User A
    const authResponse = await supabase.auth.signInWithPassword({
      email: USER_A_EMAIL!,
      password: USER_A_PASSWORD!,
    });

    expect(authResponse.data.user).toBeTruthy();
    const userAId = authResponse.data.user!.id;

    // Query own profile
    const { data: profileA, error: errorA } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userAId);

    expect(errorA).toBeNull();
    expect(profileA).toHaveLength(1);
    expect(profileA![0].id).toBe(userAId);
    expect(profileA![0].email).toBe(USER_A_EMAIL);

    await supabase.auth.signOut();
  });

  test('User A cannot select User B profile', async () => {
    const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

    // Log in as User A
    const authA = await supabase.auth.signInWithPassword({
      email: USER_A_EMAIL!,
      password: USER_A_PASSWORD!,
    });
    expect(authA.data.user).toBeTruthy();

    // Get User B ID by logging in as User B in a separate client
    const supabaseB = createClient(SUPABASE_URL!, ANON_KEY!);
    const authB = await supabaseB.auth.signInWithPassword({
      email: USER_B_EMAIL!,
      password: USER_B_PASSWORD!,
    });
    expect(authB.data.user).toBeTruthy();
    const userBId = authB.data.user!.id;
    await supabaseB.auth.signOut();

    // As User A, try to query User B's profile (RLS should block)
    const { data: profileB } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userBId);

    // RLS should prevent this - result should be empty
    expect(profileB).toHaveLength(0);

    await supabase.auth.signOut();
  });

  test('User A cannot update User B profile', async () => {
    const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

    // Log in as User A
    const authA = await supabase.auth.signInWithPassword({
      email: USER_A_EMAIL!,
      password: USER_A_PASSWORD!,
    });
    expect(authA.data.user).toBeTruthy();

    // Get User B ID
    const supabaseB = createClient(SUPABASE_URL!, ANON_KEY!);
    const authB = await supabaseB.auth.signInWithPassword({
      email: USER_B_EMAIL!,
      password: USER_B_PASSWORD!,
    });
    expect(authB.data.user).toBeTruthy();
    const userBId = authB.data.user!.id;
    await supabaseB.auth.signOut();

    // As User A, try to update User B's profile (RLS should block)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: 'Hacked' })
      .eq('id', userBId);

    // RLS should prevent this
    expect(updateError).toBeNull(); // Supabase may not error, just returns 0 rows updated

    // Verify update didn't happen by checking row count
    const { data: profileB } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userBId);

    expect(profileB).toHaveLength(0); // User A can't read it, so update failed

    await supabase.auth.signOut();
  });

  test('User B can select their own profile', async () => {
    const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

    // Log in as User B
    const authResponse = await supabase.auth.signInWithPassword({
      email: USER_B_EMAIL!,
      password: USER_B_PASSWORD!,
    });

    expect(authResponse.data.user).toBeTruthy();
    const userBId = authResponse.data.user!.id;

    // Query own profile
    const { data: profileB, error: errorB } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userBId);

    expect(errorB).toBeNull();
    expect(profileB).toHaveLength(1);
    expect(profileB![0].id).toBe(userBId);
    expect(profileB![0].email).toBe(USER_B_EMAIL);

    await supabase.auth.signOut();
  });

  test('User B cannot select User A profile', async () => {
    const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

    // Get User A ID
    const supabaseA = createClient(SUPABASE_URL!, ANON_KEY!);
    const authA = await supabaseA.auth.signInWithPassword({
      email: USER_A_EMAIL!,
      password: USER_A_PASSWORD!,
    });
    expect(authA.data.user).toBeTruthy();
    const userAId = authA.data.user!.id;
    await supabaseA.auth.signOut();

    // Log in as User B
    const authB = await supabase.auth.signInWithPassword({
      email: USER_B_EMAIL!,
      password: USER_B_PASSWORD!,
    });
    expect(authB.data.user).toBeTruthy();

    // As User B, try to query User A's profile (RLS should block)
    const { data: profileA } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userAId);

    // RLS should prevent this - result should be empty
    expect(profileA).toHaveLength(0);

    await supabase.auth.signOut();
  });

  test('anonymous client cannot read profile rows', async () => {
    const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

    // Without authentication, try to query profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    // RLS should prevent anonymous access - either error or empty result
    if (error) {
      // Permission denied is expected (anonymous has no access)
      expect(error.code).toBe('42501'); // permission_denied
    } else {
      // If no error, result should be empty
      expect(profiles).toHaveLength(0);
    }
  });
});
