# Local Development Setup

This guide walks through setting up a local development environment for Tutoring Command Center.

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+
- Git
- A Supabase account (free tier is sufficient for development)
- A code editor (VS Code recommended)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/tutoring-command-center.git
cd tutoring-command-center
```

## Step 2: Install Dependencies

```bash
npm install
```

If you encounter peer dependency warnings, they are expected and can be safely ignored for development.

## Step 3: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Create a new project:
   - Name: "Tutoring Command Center Dev"
   - Choose a region closest to you
   - Set a strong password

3. Wait for project to initialize (2-3 minutes)

## Step 4: Get Supabase Credentials

1. In Supabase project dashboard, go to Settings → API
2. Copy your:
   - `Project URL` (under "API")
   - `anon public` key (under "Project API keys")

## Step 5: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-step-4
```

**Do NOT commit `.env.local`** — it's in `.gitignore` for security.

## Step 6: Verify Configuration

```bash
npm run typecheck
```

If this passes, your environment is set up correctly.

## Step 7: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the home page.

## Step 8: Initialize Database

```bash
npm run db:migrate
```

This applies any existing migrations. In Phase 0, there are no migrations yet, so this may be a no-op.

## Development Workflow

### Running the App

```bash
npm run dev
```

The app hot-reloads as you save files.

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests (app must be running)
npm run test:e2e

# Watch mode
npm run test -- --watch
```

### Code Quality Checks

```bash
# Format check
npm run format:check

# Auto-format
npm run format

# Lint
npm run lint

# Type check
npm run typecheck
```

### Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### "Cannot find module '@/lib/supabase/client'"

- Make sure `tsconfig.json` has correct path alias: `"@/*": ["./src/*"]`
- Clear `.next` directory: `rm -rf .next`
- Restart dev server: `npm run dev`

### Environment variables not loading

- Check that `.env.local` exists in project root (not in `src/`)
- Verify variable names start with `NEXT_PUBLIC_` for browser vars
- Restart dev server after editing `.env.local`

### Port 3000 already in use

Use a different port:

```bash
npm run dev -- -p 3001
```

### Supabase connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that Supabase project is online (visit supabase.com dashboard)
- Confirm your IP is not blocked by firewall

### Tests fail with "Cannot find module"

```bash
npm run test -- --clearCache
rm -rf node_modules/.vite
npm run test
```

## Next Steps

- Read [CLAUDE.md](../CLAUDE.md) for development guidelines
- Check out [ARCHITECTURE.md](../ARCHITECTURE.md) for system design
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for PR workflow

## Getting Help

- Issues: Open a GitHub issue with details
- Questions: Start a GitHub discussion
- Security concerns: Email maintainers privately
