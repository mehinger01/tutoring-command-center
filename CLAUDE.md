# CLAUDE.md: Durable Instructions for Tutoring Command Center

This document contains permanent, authoritative guidance for developing and extending this application. Follow these instructions faithfully across all implementation phases.

## Product & Purpose

**Tutoring Command Center** is a private operational and instructional system for managing:

- Tutoring clients (prospective, onboarding, active, paused, completed, archived)
- Reusable instructional resources and assessments
- Session planning, execution, and closeout
- Student profiles, progress tracking, and observations
- Private tutor notes and parent-facing documentation

This is a confidential system containing identifiable tutoring and student information. Treat all development with security and privacy as paramount.

See the [Notion Product Hub](https://app.notion.com/p/3b36a90de53681049cedeef73b215ecd) for the authoritative specification, roadmap, and acceptance criteria.

## Approved Technology Stack

**Frontend**

- Next.js 16+ (App Router)
- React 19+
- TypeScript (strict mode, mandatory)
- Tailwind CSS v4
- shadcn/ui components (where appropriate)
- Zod for validation

**Backend & Database**

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Row-Level Security (RLS) on all exposed tables

**Development & Deployment**

- npm (not yarn, pnpm, or bun)
- Vercel (production)
- GitHub (source control)
- GitHub Actions (CI/CD)

**Testing & Quality**

- Vitest (unit tests)
- Playwright (E2E tests)
- ESLint (linting)
- Prettier (formatting)
- TypeScript strict mode

**Not Approved**

- Do not add framework dependencies (Next.js extensions, alternative routers, SSR/SSG middleware libraries) without explicit justification and review
- Do not use CSS-in-JS or runtime styling libraries; use Tailwind only
- Do not add authentication libraries beyond Supabase Auth
- Do not use third-party state management (Redux, Zustand, etc.) for Phase 0–1
- Do not add ORM beyond direct Supabase queries; no Prisma or TypeORM
- Do not use GraphQL; use direct REST/RPC via Supabase

## Architecture & Directory Structure

```
src/
  app/                         # Next.js App Router pages and layouts
    (auth)/                    # Auth pages (login, logout, signup)
    (dashboard)/               # Protected dashboard (requires auth)
    layout.tsx                 # Root layout
    page.tsx                   # Home/landing
    error.tsx                  # Error boundary
    not-found.tsx              # 404 page
    loading.tsx                # Loading skeleton (when appropriate)

  components/                  # Reusable React components
    ui/                        # shadcn/ui and primitive components
    (feature)/                 # Feature-specific components

  lib/
    auth/                      # Authentication utilities
    errors/                    # Error handling and app-error types
    logging/                   # Structured logging
    supabase/                  # Supabase client instances (client.ts, server.ts)
    validation/                # Zod schemas and validation (env.ts for environment)

  server/
    actions/                   # Server actions (mutations)
    services/                  # Business logic services
    repositories/              # Database access layer (queries)

  types/                       # Global TypeScript types and interfaces

  tests/                       # Unit and component tests

supabase/
  migrations/                  # SQL migration files (ordered by number)
  seeds/                       # Seed data scripts

docs/
  architecture/                # Architecture decisions
  implementation/              # Implementation guides
  security/                    # Security and privacy documentation
  testing/                     # Testing strategies

.github/
  workflows/                   # GitHub Actions CI/CD
  ISSUE_TEMPLATE/              # Issue templates
  pull_request_template.md     # PR template
```

## Server vs. Client Boundaries

**Server-Only (never in browser)**

- Database queries and mutations
- Supabase service-role operations
- Authentication verification
- Sensitive business logic
- API key handling
- Logging of sensitive data
- Private data transformation

**Client-Only (run in browser)**

- UI rendering and interaction
- Form validation (UX only, not authorization)
- Client-side state and interactivity
- Navigation

**Shared (can run on both)**

- Input validation (always re-validate on server)
- Type definitions
- Utility functions
- Constants

**Rule**: Never export server-only code from files marked `'use server'` in a way that browser code could import it. Use the `@/lib/supabase/server.ts` instance only in server actions or route handlers.

## Authentication & Authorization

### Current Phase 0 Status

- Email/password login form exists but is non-functional
- Authentication configuration is **not yet complete**
- Setup requires manual Supabase configuration (see docs)

### Requirements for Later Phases

- **Protected routes**: All `/dashboard/*` routes require authenticated session
- **Server-side verification**: Every protected server action must verify `user_id` from session
- **No client-side-only checks**: Middleware and route handlers enforce protection; client-side redirects are UX only
- **Row-Level Security**: Every query must respect user's `owner_id` via RLS
- **Session data**: Only read session from server context (cookies, headers), never trust client-provided user IDs

### Authentication Patterns

```typescript
// Server action or route handler
import { createClient } from '@/lib/supabase/server';

export async function protectedAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);

  // user.id is verified server-side; now query with RLS
  return await supabase.from('students').select('*');
}
```

## Database Access & RLS

### Mandatory Rules

1. **Every table in public schema must have RLS enabled** — no exceptions
2. **Every RLS policy must be explicit** — no blanket "all access" policies
3. **Policies must reference `auth.uid()`** — never hardcode user IDs
4. **Row-level data ownership** — tie rows to `owner_id` and verify in policies
5. **No service-role credentials in browser** — never `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

### Example RLS Policy

```sql
CREATE POLICY "Users can read/write own students"
  ON students
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

### Database Changes

- **Migrations**: All schema changes in `supabase/migrations/` as numbered SQL files
- **Local testing**: Use `supabase start` and `supabase db push` to test migrations locally
- **Production**: Migrations run automatically on deployment; never apply manually
- **Reversibility**: Write UP and DOWN migrations; test rollback locally

## Environment Variables

**Required**

```
NEXT_PUBLIC_SUPABASE_URL=          # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anonymous key (safe to expose)
```

**Optional (later phases)**

```
OPENAI_API_KEY=                    # For AI features (not Phase 0)
```

**Never in `.env.local` (commit to `.env.example` only)**

- Supabase service-role key
- API keys for production services
- OAuth secrets
- Database passwords
- Private keys

**Validation**

- Environment is validated at startup in `src/lib/validation/env.ts`
- Invalid config causes clear error with missing variable names
- Check `validateEnvironment()` is called in any server-side code that needs env vars

## TypeScript & Code Quality

### Mandatory

- **Strict mode**: All TypeScript files compile with `strict: true`
- **No `any`**: Never use `any` without a documented exception
- **Explicit types**: Always define function parameter and return types
- **Union over optional**: Prefer `status: 'loading' | 'success' | 'error'` over optional booleans
- **Exhaustiveness checks**: Use `never` to ensure all cases are handled

### Style

- Single quotes (`'string'`, not `"string"`)
- Semicolons required
- 2-space indentation (enforce via Prettier)
- No commented-out code
- Comments only for WHY, not WHAT (code should read itself)

### Imports

- Import order: React/Next → external packages → @/ aliases → relative imports
- Group and sort within each section
- Use `import type` for type-only imports
- No wildcard imports except where intentional

## Input Validation & Security

### Client-Side

- Form validation is UX only; assume it can be bypassed
- Use Zod schemas for shape validation
- Provide user-friendly error messages

### Server-Side

- **Always re-validate** all user input in server actions and route handlers
- Use Zod schemas to parse and validate before database operations
- Reject invalid input with `AppError` (validation errors = 400)
- Never trust `user_id`, timestamps, or other "computed" values from the client

### Sensitive Data

- Never log full objects containing passwords, tokens, or keys
- Never store full IEP documents without explicit justification
- Prefer functional descriptions over medical/diagnostic detail
- Use first name + last initial where appropriate
- Sanitize file uploads; validate file types, sizes, and content

## Error Handling

### AppError Hierarchy

```typescript
import { AppError, ErrorCode } from '@/lib/errors/app-error';

// Server-side
throw new AppError('User not found', ErrorCode.NOT_FOUND, 404);

// Client-side safe message
import { getClientErrorMessage } from '@/lib/errors/app-error';
try {
  // ...
} catch (error) {
  console.error(error); // full error
  alert(getClientErrorMessage(error)); // safe, user-friendly
}
```

### Logging

- Structured logging for debugging (implementation in `src/lib/logging/`)
- Never log full authentication tokens or API keys
- Include error IDs/correlation IDs where useful for debugging
- Log exceptions at server layer; surface friendly messages to client

## AI Output Validation (Future Phases)

When implementing AI-assisted features (lesson generation, intake extraction, etc.):

- **Always validate AI output** against a Zod schema before storage
- **Never store unvalidated AI output** in the database
- **Treat AI output as untrusted input** (sanitize, validate, limit length)
- **Log AI prompts carefully**: exclude sensitive student/tutor information
- **Enable human review** for sensitive operations before AI output is exposed

## Testing

### Unit Tests (Vitest)

- Test business logic in `src/lib/` and `src/server/`
- Use descriptive test names: `describe('validateEmail')` → `it('rejects invalid email addresses')`
- Avoid testing React components unless logic is complex; test via E2E instead

### Component Tests

- Minimal coverage; focus on E2E for UI
- Test accessibility (ARIA, keyboard navigation) when applicable

### E2E Tests (Playwright)

- Test public user flows: landing page, login, protected access, logout
- Test auth boundary: unauthenticated requests redirect to login
- Focus on happy paths; critical error paths can be in unit tests

### Test Data

- Use seeded data or test fixtures in `supabase/seeds/`
- Never hardcode personal names or real student data in tests
- Clean up test data after each run

### Running Tests

```bash
npm run test                # Unit tests
npm run test:e2e           # E2E tests (requires app running or dev server)
npm run test:e2e:ui        # Interactive Playwright UI
```

## Definition of Done

A feature or bugfix is not complete until:

- [ ] Code compiles with `npm run typecheck` (no errors)
- [ ] Code passes `npm run lint` (no warnings; use `--max-warnings 0`)
- [ ] Code passes `npm run format:check` (Prettier)
- [ ] Unit tests pass: `npm run test`
- [ ] E2E tests pass (if applicable): `npm run test:e2e`
- [ ] Production build succeeds: `npm run build`
- [ ] No console errors or warnings during manual testing
- [ ] Protected routes are actually protected (unauthenticated users redirected)
- [ ] Database queries respect RLS (verified in logs or test)
- [ ] Changes are committed with clear, descriptive messages
- [ ] PR description explains WHY, not just WHAT

## Before Opening a Pull Request

**Run these commands and confirm all pass:**

```bash
npm run format:check  # If this fails, run: npm run format
npm run lint
npm run typecheck
npm run test
npm run build
# Also run E2E if modified user flows
```

**Do NOT submit a PR if:**

- Lint or type-check fails
- Secrets, API keys, or credentials are committed
- Tests are disabled or commented out
- Code contains `any`, `@ts-ignore`, or `// TODO` without justification
- Breaking changes are unexplained
- Scope has expanded beyond the assigned vertical slice

## Prohibited Shortcuts

- Do not use `--force` or `--legacy-peer-deps` to bypass dependency conflicts in production code
- Do not disable TypeScript strict mode
- Do not disable ESLint rules without explicit justification and a `// eslint-disable-line` comment
- Do not suppress error handling to force tests to pass
- Do not commit `.env` files or secrets
- Do not mix multiple unrelated changes in one PR
- Do not rebase away reviewed commits without discussion

## Scope Control

Each phase has a specific scope. Do not implement features from future phases:

- **Phase 0** (current): Foundation, auth skeleton, testing structure ✓
- **Phase 1** (next): Student lifecycle, intake processing, session records
- **Phase 2**: Resource library, assessments, reusable components
- **Phase 3**: Calendar sync, Varsity Tutors integration
- **Phase 4**: AI-assisted features, ScholarForge integration

Placeholder documentation and comments are OK for future phases; speculative implementations are not.

## Deployment

### Vercel Setup

- Connect GitHub repository to Vercel
- Set environment variables in Vercel project settings
- Production deploys require human approval (PR merge)
- Preview deployments are automatic on PR creation

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No unhandled console errors
- [ ] Environment variables are set in Vercel
- [ ] RLS policies are correct (test locally)
- [ ] Database migrations have been applied
- [ ] Secrets are not exposed in build output

### Rollback

- Revert the commit and force-push (or use Vercel's deployment history)
- Verify RLS and auth still work on rollback
- Check that database migrations are still applied (don't auto-rollback)

## Privacy & Sensitive Data

### Collection Principles

- Collect only information necessary for instruction and operations
- Avoid collecting identifiable information beyond necessity
- Do not store full IEP documents unless explicitly required
- Do not collect medical diagnoses; use functional descriptions instead

### Storage & Access

- Keep private tutor observations separate from student-facing content
- Never expose private records through public-facing pages
- Use first name + last initial where appropriate
- Tag records with sensitivity level (private, tutor-only, parent-visible)

### Deletion & Export

- Design database schema to support future export/deletion features
- Document how student records would be deleted or exported
- Consider cascade behavior (when student is archived, what happens to related records?)

### Logging

- Do not log full session objects, API responses, or form data
- Do not log full authentication tokens or API keys
- Log structured error messages and IDs for debugging
- Sanitize logs before sending to external services

## Monitoring & Observability (Phase 0: Minimal)

Phase 0 does not require external monitoring services. When added in future phases:

- Use structured logging (JSON format)
- Log error IDs for correlation
- Do not use an expensive monitoring vendor without justification
- Document expected error rates and patterns
- Set up alerts for 5xx errors and authentication failures

## Questions & Escalation

When faced with an unclear decision:

1. Check this document (CLAUDE.md) and ARCHITECTURE.md
2. Review Notion Product Hub for scope/requirements
3. Check existing code for patterns
4. Consult CONTRIBUTING.md for process questions
5. If still unclear, document the decision, explain the options, and ask for review

## Version History

| Date       | Change                         | Phase   |
| ---------- | ------------------------------ | ------- |
| 2025-08-05 | Initial CLAUDE.md (Foundation) | Phase 0 |
