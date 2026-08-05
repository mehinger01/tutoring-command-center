# Architecture: Tutoring Command Center

This document describes the high-level architecture, key design decisions, and technical rationale for Tutoring Command Center.

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  ┌─────────────────────────────────────────────┐   │
│  │  React Components (Next.js App Router)      │   │
│  │  - Page layouts                             │   │
│  │  - Forms and navigation                     │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────┴────────────────────────────────┐
│              Next.js Server                         │
│  ┌─────────────────────────────────────────────┐   │
│  │  Server Components & Server Actions         │   │
│  │  - Session verification                     │   │
│  │  - Input validation (Zod)                   │   │
│  │  - Business logic                           │   │
│  └─────────────────────────────────────────────┘   │
└────────────────┬───────────────────┬────────────────┘
                 │                   │
            Supabase Auth        Supabase PostgreSQL
                 │                   │
     ┌───────────┴───────────┬───────┴──────────────┐
     │                       │                      │
┌────▼──────────┐   ┌────────▼────────┐   ┌────────▼────────┐
│  Auth Tokens  │   │   Data Storage  │   │   Row-Level     │
│  - Session    │   │   - Tables      │   │   Security      │
│  - User ID    │   │   - Rows        │   │   - Policies    │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

## Technology Choices & Rationale

### Frontend: Next.js 16 with App Router

**Why Next.js?**

- Full-stack framework (frontend + backend in one codebase)
- Server Components enable secure data fetching
- Server Actions simplify client-server communication
- Incremental Static Regeneration for performance
- Vercel deployment integration

**Why App Router (not Pages)?**

- Recommended for new projects
- Better layout composition
- Parallel routes for features (Phase 2+)
- Middleware for auth checks

**Why React 19?**

- Latest stable version
- Server Component improvements
- Better performance
- Recommended by Create-Next-App

### Styling: Tailwind CSS + shadcn/ui

**Why Tailwind?**

- Utility-first CSS (fast, no naming conflicts)
- Responsive design out-of-box
- Dark mode support (via CSS variables)
- Zero runtime overhead
- Strong ecosystem

**Why shadcn/ui?**

- Copy-paste components (no black-box dependencies)
- Full control over styling
- Accessibility built-in
- Minimal but well-maintained library

**Why not CSS-in-JS?**

- Runtime overhead
- Harder to maintain
- Tailwind + Tailwind CSS is sufficient
- No dynamic styling needs in Phase 0–1

### Database: Supabase PostgreSQL + RLS

**Why Supabase?**

- Managed PostgreSQL (no DevOps)
- Authentication built-in (Supabase Auth)
- Row-Level Security for multi-tenant data
- Real-time APIs (for future phases)
- Reasonable free tier
- SQL migrations (version-controlled)

**Why PostgreSQL?**

- Powerful relational model
- ACID transactions
- Row-Level Security (first-class)
- JSON columns for semi-structured data
- Rich query language (SQL)

**Why RLS over app-level auth?**

- Database enforces access control (defense in depth)
- Impossible to bypass by attacking app
- Handles concurrent access safely
- Audit trail in database logs
- Scalable to multi-tenant (future phases)

**Why not NoSQL?**

- Relational model is natural fit for tutoring domain
- Transactions important for data integrity
- RLS not available in Firebase/Firestore

### Authentication: Supabase Auth

**Why Supabase Auth?**

- Built-in to Supabase
- Secure session management
- Email + OAuth out-of-box
- Row-Level Security integration
- No additional vendor

**Why email + password (Phase 0)?**

- Simple, no external OAuth setup needed
- Can add Google/GitHub OAuth later
- Minimal configuration required

**Why HTTP-only cookies?**

- Cannot be accessed by JavaScript (XSS protection)
- Automatically sent by browser (CSRF protection built-in)
- Session stored server-side (Supabase)

### Validation: Zod

**Why Zod?**

- TypeScript-first schema validation
- Type inference (validate and get types automatically)
- Clear, composable schemas
- Excellent error messages
- Small bundle size

### Forms: React Hook Form

**Why React Hook Form?**

- Minimal re-renders
- Small bundle size
- Easy integration with Zod (via `@hookform/resolvers`)
- Built-in form state management

## Data Model (Phase 0 Foundation)

Current Phase 0 includes minimal schema to prove authentication and RLS patterns:

### auth.users (Supabase-managed)

- `id` (UUID)
- `email` (unique)
- `created_at` (timestamp)
- Plus: Supabase Auth fields (password hash, etc.)

### (Future) public.profiles

- `id` (UUID, references auth.users)
- `tutor_id` (same as id, denormalized for convenience)
- `email` (denormalized from auth.users)
- `created_at` (timestamp)
- RLS policy: User can only read/write own profile

**Future tables** (Phase 1+):

- `students` (with owner_id, RLS)
- `sessions` (with owner_id, RLS)
- `resources` (with owner_id, RLS)
- etc.

**Pattern**: Every table has:

- `id` (UUID primary key)
- `owner_id` (UUID foreign key to auth.users)
- `created_at`, `updated_at` (timestamps)
- RLS policy on owner_id

## API Architecture

### Server Actions (Recommended for Phase 1+)

```typescript
// src/server/actions/student.ts
'use server';

export async function createStudent(data: CreateStudentInput) {
  const user = await getUser(); // Verify auth
  if (!user) throw new Error('Unauthorized');

  const validated = studentSchema.parse(data); // Validate input

  const supabase = await createClient(); // Server Supabase client
  return supabase.from('students').insert({ ...validated, owner_id: user.id }); // RLS enforces owner check
}
```

**Why Server Actions?**

- Type-safe client→server communication
- No separate API routes needed for simple operations
- Automatic CSRF protection
- Session verification built-in

### Route Handlers (for API endpoints, Phase 2+)

```typescript
// src/app/api/students/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('students')
    .select('*') // RLS filters to user's own rows
    .eq('owner_id', user.id);

  return Response.json(data);
}
```

## Client vs. Server Code

### Client-Side (Browser)

- React components (`use client`)
- User interaction (clicks, form input)
- Client-side form validation (UX only)
- Navigation
- Local state (useState, useContext)

### Server-Side (Node.js)

- Page layouts and initial data fetching
- Server Actions (mutations)
- Route handlers (API endpoints)
- Session verification
- Database access
- Input validation (real, authorization)
- Logging and secrets

### Boundary Enforcement

```typescript
// ❌ Wrong: Server code in client file
'use client';
import { serverOnlyFunction } from './server'; // Error!

// ✓ Correct: Import server action from separate file
('use client');
const { createStudent } = await import('@/server/actions/student');
```

## Error Handling Strategy

### Errors at Each Layer

**Client Layer:**

- Form validation errors → display inline
- Network errors → show "Try again" button
- Unexpected errors → display generic message, log error ID

**Server Layer:**

- Input validation → return 400 Bad Request
- Authorization → return 403 Forbidden
- Not found → return 404
- Server errors → return 500, log with error ID
- Never expose internal details to client

**Database Layer:**

- RLS policies enforce access (silent rejection, not 403)
- Unique constraint violations → 409 Conflict
- Referential integrity violations → 400 Bad Request

### Error Types

```typescript
// Custom error type (see src/lib/errors/app-error.ts)
class AppError {
  code: ErrorCode; // UNAUTHORIZED, FORBIDDEN, etc.
  statusCode: number; // 401, 403, 500, etc.
  message: string; // Safe to show to user
  isOperational: boolean; // True if expected, false if programmer error
}
```

## Security Architecture

### Defense in Depth

1. **Browser**: HTTPS only, no secrets in code
2. **Server**: Validate input, verify session, check authorization
3. **Database**: RLS policies, no hardcoded user IDs
4. **Secrets**: Environment variables, never in code

### Authentication Flow

```
1. User submits email + password
2. Supabase Auth verifies credentials
3. Supabase Auth creates session (JWT + refresh token)
4. Session stored in HTTP-only cookie
5. Browser sends cookie with every request
6. Server verifies session with Supabase Auth
7. If valid, `user_id` is trusted for queries
```

### Authorization Pattern

```
For every server operation:
1. Get user from session (server-side, verified)
2. Validate input (Zod schema)
3. Query database with RLS
   - If user owns the row → query succeeds
   - If user doesn't own row → RLS silently rejects
4. Return result or error
```

## Directory Structure Rationale

```
src/
  app/                    # Next.js App Router pages/layouts
    (auth)/               # Group: auth routes (not in URL)
    (dashboard)/          # Group: dashboard routes
    layout.tsx            # Root layout (shared)
    page.tsx              # Home page
    error.tsx             # Error boundary
    not-found.tsx         # 404 page

  components/             # Reusable React components
    ui/                   # Primitive UI elements (Button, Input, etc.)
    dashboard/            # Dashboard-specific components

  lib/                    # Utilities and helpers
    auth/                 # Auth-related functions (future)
    errors/               # Error types and handling
    logging/              # Logging utilities
    supabase/             # Supabase client setup
    validation/           # Zod schemas, env validation

  server/                 # Server-only code (never imported by client)
    actions/              # Server Actions (mutations)
    services/             # Business logic (no DB access)
    repositories/         # Database queries

  types/                  # Global TypeScript types

supabase/
  migrations/             # SQL migration files (numbered)
  seeds/                  # Seed data scripts

docs/                     # Documentation
```

## Deployment Architecture

```
GitHub Repository
  ↓ (push to main)
GitHub Actions CI/CD
  ├─ npm run format:check
  ├─ npm run lint
  ├─ npm run typecheck
  ├─ npm run test
  ├─ npm run build
  ↓ (if all pass + human approval)
Vercel Platform
  ├─ Build: npm install && npm run build
  ├─ Deploy to preview URL
  ├─ Database migrations (via Supabase CLI in GitHub Action)
  ├─ Set environment variables
  ↓ (production)
Vercel Production
  ├─ HTTPS endpoint
  ├─ Global CDN
  ├─ Automatic HTTPS
  ↓ (connects to)
Supabase PostgreSQL
  ├─ Production database
  ├─ Authentication service
  ├─ Storage
```

## Performance Considerations

### Bundle Size

- Tailwind CSS (utilities only, ~10KB gzipped)
- React & Next.js (included)
- shadcn/ui (copy-paste, only used components)
- Target: < 100KB JavaScript per page

### Database Performance

- Indexes on frequently queried columns (to be added during schema design)
- RLS policies optimized to avoid sequential scan
- Pagination for large result sets (Phase 2+)
- Denormalization only when necessary

### Caching

- Next.js ISR (Incremental Static Regeneration) for public pages
- HTTP caching headers for static assets
- Supabase row-level caching (automatic)
- No client-side state synchronization yet (Phase 0)

## Monitoring (Future)

Phase 0 does not require external monitoring. When added:

- Structured JSON logs to stdout
- Error tracking (Sentry or similar)
- Performance monitoring (Web Vitals)
- Uptime monitoring
- Database slow query log

## Design Decisions & Trade-offs

| Decision                 | Rationale                                             | Trade-off                                               |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------- |
| **Server Components**    | Secure (no secrets in browser), reduced bundle size   | Less interactive until hydration complete               |
| **Server Actions**       | Type-safe, simple, no API route boilerplate           | Less flexibility than REST API for complex workflows    |
| **RLS over app-auth**    | Impossible to bypass, audit trail, multi-tenant ready | Requires SQL knowledge, debugging harder                |
| **Tailwind + shadcn/ui** | No runtime overhead, full control, well-maintained    | More verbose than Bootstrap, larger team learning curve |
| **Supabase**             | All-in-one (auth + DB + storage), simple setup        | Vendor lock-in, less control than self-hosted           |
| **Next.js App Router**   | Recommended, best practices built-in, great DX        | Fewer resources/examples than Pages Router              |

## Future Architectural Changes

### Phase 1–2: Scale Data

- Implement pagination
- Add database indexes strategically
- Consider caching layer if needed

### Phase 3: Real-time Features

- Supabase Realtime for live collaboration
- WebSocket connections for activity feeds
- May add state management (currently React hooks only)

### Phase 4: AI Integration

- Separate AI service (no AI calls from Next.js app)
- Queue system for long-running tasks
- Webhook handlers for async operations

## Questions & Decisions

**Q: Why not use Prisma?**
A: RLS is best expressed in raw SQL. Prisma adds complexity without benefit for Phase 0. Revisit if raw queries become verbose.

**Q: Why not use GraphQL?**
A: REST/Supabase API is simpler for a single tutor system. GraphQL overhead not justified. Revisit if API gets complex.

**Q: Why no global state management?**
A: React hooks + Server Components sufficient for Phase 0–1. Add only if passing props becomes deeply nested.

**Q: Why not TypeORM or similar?**
A: Supabase client is lightweight enough. Adding ORM adds abstraction without benefit given RLS patterns.

---

**Last Updated**: 2025-08-05
**Phase**: 0 (Foundation)
