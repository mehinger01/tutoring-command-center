# Contributing to Tutoring Command Center

Thank you for contributing to this project! This document describes the workflow and expectations for all contributors.

## Development Workflow

### 1. Branch from Main

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Use descriptive branch names: `feature/`, `bugfix/`, or `docs/`.

### 2. Make Changes

- Follow the style guide in [CLAUDE.md](./CLAUDE.md)
- Make small, logical commits with clear messages
- Test your changes locally

### 3. Run Quality Checks

Before committing:

```bash
npm run format        # Auto-format code
npm run lint          # Check for lint errors
npm run typecheck     # Verify TypeScript
npm run test          # Run unit tests
npm run test:e2e      # Run E2E tests (if applicable)
npm run build         # Verify production build
```

All checks must pass before opening a PR.

### 4. Commit Messages

Write clear, descriptive commit messages:

```
Fix: Correct authentication redirect on login failure

- Verify session before redirecting to dashboard
- Add test for unauthenticated state
- Update error message to be more helpful
```

Use imperative mood ("Fix", "Add", "Update", not "Fixed", "Added").

### 5. Open a Pull Request

Push your branch and open a PR:

```bash
git push origin feature/your-feature-name
```

- Reference any related issues
- Describe what was changed and why
- Link to Notion product spec if adding features
- Note any breaking changes

**Do not merge your own PR.** A human reviewer will review and merge.

### 6. Code Review

Respond to review comments:

- Fix issues directly in new commits (don't squash; show the fix)
- Explain reasoning if you disagree
- Mark conversations as resolved when addressed

### 7. Merge

Once approved, maintainers will merge to `main`. The PR will be deleted after merge.

## Testing Guidelines

### When to Write Tests

- **Always**: Logic in `src/lib/` and `src/server/`
- **Often**: Complex components or hooks
- **E2E**: User flows like login, navigation, form submission

### What to Test

- Happy paths (user does everything right)
- Common error cases (missing input, network failure)
- Boundary conditions (empty arrays, null values)
- Accessibility (keyboard navigation, screen readers)

### Running Tests

```bash
# Unit tests (watch mode)
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test -- --coverage
```

### Test Data

- Use realistic but fake data (not real student names/emails)
- Clear test data after each run
- Document test setup in test files

## Code Style

### TypeScript

- Use strict types; no `any`
- Explicit return types on functions
- Use `readonly` for immutable data

### React

- Functional components only
- Use hooks for state and effects
- Separate UI components from logic

### Naming

- Components: PascalCase (`UserCard`)
- Functions/variables: camelCase (`getUserData`)
- Constants: UPPER_SNAKE_CASE (`MAX_STUDENTS`)
- Files: match the main export (component files = PascalCase, utility files = camelCase)

### Imports

```typescript
// 1. React/Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. External packages
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// 3. Internal (@/ aliases)
import { Button } from '@/components/ui/button';
import { validateEmail } from '@/lib/validation/email';

// 4. Relative imports
import { helper } from './helper';
```

## Database Changes

### Migrations

1. Create a new numbered SQL file in `supabase/migrations/`:

   ```
   supabase/migrations/20250805_create_students_table.sql
   ```

2. Write UP migration:

   ```sql
   CREATE TABLE students (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     name text NOT NULL,
     created_at timestamptz DEFAULT now()
   );

   ALTER TABLE students ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can read/write own students"
     ON students
     FOR ALL
     USING (owner_id = auth.uid())
     WITH CHECK (owner_id = auth.uid());
   ```

3. Test locally:

   ```bash
   supabase start
   supabase db push
   # Test queries, then rollback/retry
   ```

4. Include DOWN migration comments at end of file for rollback reference

### RLS Policies

- **Required**: Every table in public schema must have RLS enabled
- **Explicit**: Write specific policies, not blanket access
- **User-aware**: Use `auth.uid()`, not hardcoded IDs
- **Test**: Verify policies work with real queries in test environment

## Documentation

### When to Document

- **Always**: New features, configuration changes, deployment procedures
- **Often**: Complex logic, architectural decisions, gotchas
- **Update**: Docs that reference changed code or process

### Where to Document

- User-facing features → `docs/implementation/`
- Architecture decisions → `docs/architecture/`
- Security/privacy → `SECURITY.md`
- Setup procedures → `README.md` or `docs/`
- Developer guidance → `CLAUDE.md` (or update it)

## Security

- Do not commit secrets, API keys, or credentials
- Never hardcode user IDs in logic
- Always validate server-side, even if client validates
- Check `.env.example` for what's safe to expose
- Report security issues privately to the maintainers

## Performance

- Monitor bundle size for new dependencies
- Profile locally if adding significant computation
- Use database indexes for frequently queried columns
- Consider pagination for large result sets

## Accessibility

- Use semantic HTML (`<button>` not `<div onClick>`)
- Include `alt` text on images
- Ensure keyboard navigation works
- Test with screen reader if adding UI
- Use sufficient color contrast (WCAG AA minimum)

## Questions?

- Ask in PR comments
- Check [CLAUDE.md](./CLAUDE.md) for technical guidance
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions
- Review existing code for patterns and examples
