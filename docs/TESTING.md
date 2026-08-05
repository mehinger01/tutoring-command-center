# Testing Strategy

Tutoring Command Center uses a comprehensive testing approach covering unit tests, component tests, and end-to-end tests.

## Testing Pyramid

```
        ▲
       /│\
      / │ \         E2E Tests (Playwright)
     /  │  \        - Full user journeys
    /───┼───\       - Integration points
   /    │    \
  /─────┼─────\     Component Tests (Vitest)
 /      │      \    - React components
/__User_│_Interactions_\

_________Base (Unit Tests)_________
- Business logic
- Utilities
- Type safety
```

## Unit Tests (Vitest)

### What to Test

- Business logic in `src/lib/`
- Server actions in `src/server/`
- Utility functions
- Complex component logic

### Where to Put Tests

```
src/
  lib/
    validation/
      email.ts
      email.test.ts        # Test next to implementation
```

### Example Unit Test

```typescript
// src/lib/validation/email.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from './email';

describe('validateEmail', () => {
  it('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

### Running Unit Tests

```bash
npm run test              # Run once
npm run test -- --watch   # Watch mode
npm run test -- --ui      # Visual UI
```

## Component Tests

### What to Test

- Component renders correctly
- Props are handled correctly
- User interactions (clicks, form submission)
- Conditional rendering
- Accessibility (a11y)

### Example Component Test

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from 'vitest-environment-jsdom';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is accessible with keyboard', () => {
    render(<Button>Click</Button>);
    const button = screen.getByText('Click');

    expect(button).toHaveProperty('type', 'button');
    expect(button).not.toHaveAttribute('disabled');
  });
});
```

## End-to-End Tests (Playwright)

### What to Test

- Complete user journeys
- Navigation flows
- Form submission and validation
- Authentication (login, logout)
- Error states

### Where to Put Tests

```
tests/
  e2e/
    auth.spec.ts          # All auth-related flows
    dashboard.spec.ts     # Dashboard flows
```

### Example E2E Test

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in and access dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/auth/login');

    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit
    await page.click('button:has-text("Sign In")');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/auth/login');
  });
});
```

### Running E2E Tests

```bash
# Start dev server first
npm run dev

# In another terminal
npm run test:e2e

# Interactive UI
npm run test:e2e:ui

# Headed mode (see browser)
npx playwright test --headed
```

## Test Data & Fixtures

### Using Fixtures

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'Test123!',
  },
  student: {
    email: 'student@example.com',
    password: 'Test123!',
  },
};
```

### Seeding Test Data

For E2E tests that need database state, use Supabase seeding:

```bash
# Create seed script
supabase/seeds/test-data.sql

# Run before E2E tests
npm run db:seed
npm run test:e2e
```

## Coverage

### Checking Coverage

```bash
npm run test -- --coverage
```

### Coverage Targets

| Metric     | Target |
| ---------- | ------ |
| Statements | > 70%  |
| Branches   | > 65%  |
| Functions  | > 70%  |
| Lines      | > 70%  |

Do not aim for 100% coverage; focus on critical paths and complex logic.

### Exclude from Coverage

```typescript
// vitest.config.ts
coverage: {
  exclude: [
    'node_modules/',
    'src/app/**', // Pages/layouts often not worth testing
    '**/*.d.ts',
    '**/index.ts', // Re-exports
  ];
}
```

## Testing Best Practices

### Do's ✓

- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused and isolated
- Use realistic test data
- Test error cases
- Test accessibility
- Keep tests DRY (reuse fixtures)

### Don'ts ✗

- Don't test framework internals
- Don't test library code
- Don't use `waitFor` for everything (use reliable waits)
- Don't hardcode timeouts
- Don't test styling (use E2E for visual)
- Don't skip flaky tests; fix them

## CI/CD Integration

Tests run automatically on:

- Pull requests: All checks must pass
- Commits to `main`: Automatic (fast fail)

See `.github/workflows/ci.yml` for configuration.

## Debugging Tests

### Debug Unit Tests

```bash
npm run test -- --inspect-brk
# Then open chrome://inspect in Chrome
```

### Debug E2E Tests

```bash
# Interactive mode
npx playwright test --debug

# Headed mode
npm run test:e2e -- --headed --debug
```

### Common Issues

**Test timeouts:**

- Increase timeout: `test.setTimeout(30000)`
- Check selectors: `await expect(page.locator('...')).toBeVisible()`

**Flaky tests:**

- Use reliable waits: `await page.waitForURL(...)`
- Avoid `sleep()`: use element wait instead
- Isolate test data to avoid conflicts

**Import errors in tests:**

- Check tsconfig includes test files
- Verify path aliases in vitest.config.ts
- Clear cache: `rm -rf .next node_modules/.vitest`

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Testing Guide](https://playwright.dev)
- [React Testing Library Queries](https://testing-library.com)

---

**Last Updated**: 2025-08-05
**Phase**: 0
