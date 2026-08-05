import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

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
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('password must be at least 6 characters', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text=Password must be at least 6 characters')
    ).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait for error message - Supabase will return an error
    await expect(page.locator('text=Invalid login credentials')).toBeVisible({
      timeout: 5000,
    });
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
