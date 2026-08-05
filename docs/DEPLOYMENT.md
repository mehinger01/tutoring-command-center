# Deployment Guide

This guide covers deploying Tutoring Command Center to Vercel and configuring Supabase for production.

## Deployment Architecture

```
GitHub
  ↓ (push main)
GitHub Actions CI
  ├─ Tests
  ├─ Lint
  ├─ Build
  ↓ (if all pass)
Vercel Deployment
  ├─ Preview (on PR)
  ├─ Production (on merge to main)
  ↓
Supabase PostgreSQL (Production)
```

## Prerequisites

1. GitHub repository (source control)
2. Vercel account (free tier works)
3. Supabase production project
4. Human approval for production deployments

## Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Vercel auto-detects Next.js
5. Click "Deploy"

## Step 2: Set Environment Variables in Vercel

1. In Vercel project Settings → Environment Variables
2. Add production Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Production anon key

3. Redeploy after adding environment variables

## Step 3: Supabase Production Setup

### Create Production Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project:
   - Name: "Tutoring Command Center - Production"
   - Choose production region
   - Set strong password
   - Note the database password

### Enable Security Features

1. **Row-Level Security**: Already mandatory; verify on tables
2. **SSL**: Enabled by default
3. **Backups**: Configure in Settings → Backups
   - Daily backups recommended
   - Keep 14+ days retention
4. **Connection Pooling**: In Settings → Database
   - Enable PgBouncer for connection pooling
   - Use pooling connection string from app

### Get Production Credentials

1. Settings → API
2. Copy:
   - `Project URL`
   - `anon public` key
3. Set these in Vercel (Step 2 above)

## Step 4: Database Migrations

### Option 1: Automatic (Recommended)

Create a GitHub Action that runs migrations on deploy:

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run migrations
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          npm install -g supabase
          supabase db push
```

### Option 2: Manual

```bash
# With Supabase CLI
supabase db push --db-url "postgresql://..."
```

## Step 5: Deployment Checklist

Before deploying to production:

- [ ] All tests pass locally and in CI
- [ ] `npm run build` succeeds
- [ ] Environment variables set in Vercel
- [ ] Supabase production project created
- [ ] RLS policies enabled on all tables
- [ ] Database backups configured
- [ ] SSL/TLS enabled
- [ ] No secrets in code (run `npm audit`)
- [ ] Preview deployment works
- [ ] Manual review of changes

## Step 6: Deploy

### First Deployment

1. Push to main branch:

   ```bash
   git push origin main
   ```

2. GitHub Actions runs CI
3. If CI passes, Vercel auto-deploys
4. Monitor deployment in Vercel dashboard

### Subsequent Deployments

Same process — merging to main triggers automatic deployment.

## Monitoring Deployments

### Vercel Dashboard

- View deployment status
- Check build logs
- Review environment variables
- View error logs

### During Deployment

```bash
# Check if app is up
curl https://your-app.vercel.app

# Monitor server logs (Vercel)
# Vercel → Project → Deployments → Logs
```

### After Deployment

- Visit the production URL
- Test critical flows (login, navigation)
- Check browser console for errors
- Monitor error logs for 24 hours

## Rollback Procedure

### If Deployment Fails or Has Critical Issues

1. **Immediate**:
   - Identify the issue
   - Review recent commits
   - Check error logs

2. **Rollback**:

   ```bash
   # Revert the problematic commit
   git revert <commit-hash>
   git push origin main
   ```

3. **Verify**:
   - Vercel auto-deploys previous version
   - Test that rollback worked
   - Investigate root cause

### Database Rollback

If a migration caused issues:

1. **Identify the migration** that caused issues
2. **Restore from backup**:
   - Supabase → Settings → Backups
   - Select backup before migration
   - Restore (creates new database)

3. **Point app to restored database** (update connection string)
4. **Fix the migration** locally
5. **Re-apply** after fix is tested

## Performance & Monitoring

### Vercel Monitoring

- Analytics → Web Vitals
- See Core Web Vitals (LCP, FID, CLS)
- Monitor function execution times

### Supabase Monitoring

- Database → Query Performance
- Monitor slow queries
- Check connection pool stats

### Logs

- Vercel → Deployments → Logs
- Supabase → SQL Editor → Logs

## Secrets Management

### Never Commit

- `.env` file (it's in `.gitignore`)
- API keys or credentials
- Supabase service-role key

### Store in Vercel

Use Vercel's environment variable interface:

```
NEXT_PUBLIC_SUPABASE_URL          # OK to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY     # OK to expose
OPENAI_API_KEY                    # SECRET (Phase 3+)
```

### Rotating Secrets

If a secret is exposed:

1. **Immediately**:
   - Rotate in Supabase/service
   - Update Vercel environment variables
   - Trigger redeploy

2. **Later**:
   - Audit logs for unauthorized access
   - Reset any affected user credentials

## Scaling & Optimization

### Phase 0-1 (Small Scale)

Current setup handles:

- 1 tutor
- 100s of students
- 1000s of sessions
- Minimal real-time features

No optimization needed.

### Phase 2-3 (Growing)

Monitor and optimize:

- Database indexes (add as queries slow)
- Query optimization (check EXPLAIN ANALYZE)
- Caching layer (if needed)
- Read replicas (Supabase Pro tier)

### Phase 4+ (Large Scale)

- Database performance optimization
- Caching strategy (Redis)
- CDN for static assets (automatic with Vercel)
- Rate limiting
- Load testing

## Disaster Recovery

### Backup Strategy

**Supabase handles:**

- Daily automatic backups (14+ day retention)
- Point-in-time recovery (PITR, if Pro tier)
- Replicated storage

**Your responsibility:**

- Test restores periodically
- Know restoration procedure
- Document RTO/RPO requirements

### Runbook

Create a runbook documenting:

- How to restore from backup
- How to roll back deployment
- How to contact Supabase support
- Emergency contacts

## Cost Optimization

### Vercel (Typically free for hobby projects)

- Free tier: 100 GB bandwidth/month
- Pro tier: $20/month (if needed for teams)

### Supabase

- **Free**: 500MB database, 50,000 monthly active users
- **Pro**: $25/month, higher limits, PITR, read replicas

### Monitoring Costs

In Vercel:

- Settings → Billing → Usage

In Supabase:

- Settings → Billing → Usage

## Troubleshooting Deployments

### Build Fails in Vercel

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Fix**: Add environment variable to Vercel

### App Starts but Shows 500 Error

```
Error: Environment validation failed
```

**Fix**: Verify all required env vars are set in Vercel

### Database Connection Fails in Production

```
Error: unable to connect to postgres
```

**Fix**:

1. Check Supabase project is online
2. Verify connection string is correct
3. Check IP whitelist (if enabled)

### Deployment Takes Too Long

**Check**:

- `npm install` time (clear cache if needed)
- Build time (optimize if > 1 minute)
- Database migration time

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/getting-started/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: 2025-08-05
**Phase**: 0
