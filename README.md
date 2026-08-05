# Tutoring Command Center

A private operational and instructional system for managing tutoring clients and reusable instructional work.

## Overview

Tutoring Command Center (TCC) is a Next.js-based application designed to support private tutoring operations. The system manages students, instructional resources, session planning, and progress tracking in a secure, privacy-focused environment.

**Status**: Phase 0 (Professional Repository Foundation) ✓

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [docs/](./docs/) for detailed technical information.

## Quick Start

### Prerequisites

- Node.js 18+ with npm
- Supabase account and project

### Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Verify configuration**

   ```bash
   npm run typecheck
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Development Commands

| Command                | Purpose                    |
| ---------------------- | -------------------------- |
| `npm run dev`          | Start development server   |
| `npm run build`        | Build for production       |
| `npm start`            | Run production server      |
| `npm run lint`         | Run ESLint                 |
| `npm run format:check` | Check code formatting      |
| `npm run format`       | Auto-format code           |
| `npm run typecheck`    | Check TypeScript types     |
| `npm run test`         | Run unit tests (vitest)    |
| `npm run test:e2e`     | Run E2E tests (Playwright) |

## Architecture

- **Frontend**: Next.js 16 with App Router, TypeScript, React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth (email/OAuth)
- **Validation**: Zod schemas
- **Forms**: React Hook Form
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Durable instructions for developers and AI
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](./SECURITY.md) - Security and privacy policies
- [docs/](./docs/) - Detailed documentation

## Security

This is a private application containing sensitive tutoring and student information. All development strictly follows:

- OWASP security baseline
- Privacy-by-design principles
- Row-Level Security (RLS) on all database tables
- Secure environment variable handling
- No hardcoded credentials

See [SECURITY.md](./SECURITY.md) for detailed security requirements.

## License

Proprietary. All rights reserved.
