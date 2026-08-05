# Security & Privacy Policy

Tutoring Command Center handles sensitive tutoring and student information. Security and privacy are paramount. All development must follow these policies.

## Security Principles

### Defense in Depth

- Multiple layers of protection (client, server, database)
- No single point of failure
- Assume any layer can be compromised; others must still protect

### Secure by Default

- Deny access by default; grant only when necessary
- Fail closed, not open (errors block access, don't grant it)
- Require explicit authorization for sensitive operations

### Privacy by Design

- Collect only required information
- Minimize data retention
- Enable future deletion and export
- Separate private (tutor) and public (student-facing) data

## Authentication & Session

### Current Implementation

- Email/password authentication via Supabase Auth
- Sessions stored in HTTP-only cookies
- CSRF protection via Supabase defaults

### Future: OAuth Support

- Google OAuth will be supported in Phase 1
- No third-party login before human approval
- Revoke third-party access on logout

### Session Security

- Sessions expire after inactivity (configure in Supabase)
- Re-verify user on sensitive operations (password change, data export)
- Logout clears session cookies
- Middleware enforces protected routes server-side

### Secrets in Code

**Never commit:**

- `.env` files with real values
- Supabase service-role keys
- API keys (OpenAI, etc.)
- OAuth secrets
- JWT tokens or session cookies

**Always use:**

- `.env.example` with placeholder values
- Vercel/deployment platform's secret manager
- Environment variables injected at runtime

## Authorization

### Rule: Server-Side Verification Only

**Allowed (safe):**

```typescript
// Server action - session verified
const user = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');
```

**Forbidden (dangerous):**

```typescript
// Client-side check - can be bypassed
if (!userId) return; // User navigates here anyway in devtools
```

### Row-Level Security (RLS)

**Mandatory:**

- Every table in public schema has RLS enabled
- Every RLS policy explicitly defines who can access what
- Policies use `auth.uid()`, not hardcoded IDs
- Policies check row-level ownership via `owner_id`

**Example Policy:**

```sql
CREATE POLICY "Users can read their own students"
  ON students
  FOR SELECT
  USING (owner_id = auth.uid());
```

**Testing RLS:**

- Query as different users
- Verify users can only see their own data
- Verify service-role doesn't bypass RLS in tests

## Data Protection

### At Rest

- Database: Supabase PostgreSQL with disk encryption
- Files: Supabase Storage (encrypted by default)
- Backups: Handled by Supabase (automatic, encrypted)

### In Transit

- HTTPS only (enforced by framework)
- TLS 1.2+ for all connections
- No unencrypted logging of sensitive data

### Sensitive Data Handling

**Do Not Store Full:**

- IEP documents (link or summary instead)
- Medical diagnoses (use functional descriptions)
- Full birth dates (month+year or age range often sufficient)
- SSN or financial information

**Use Appropriate Identifiers:**

- First name + last initial (e.g., "Alex S.") where possible
- Student ID or reference code instead of full name when available
- Hash PII if used as lookup (never in logs)

**Logging:**

- Never log authentication tokens
- Never log API keys or credentials
- Never log full request/response bodies with sensitive fields
- Error messages should not reveal system details (e.g., "Database error: ..." is too specific)

## API & Network Security

### Input Validation

**Client-Side (UX only):**

- Form validation provides feedback
- Can be bypassed; do not rely on it for security

**Server-Side (mandatory):**

- Parse and validate all user input with Zod
- Reject unexpected fields
- Enforce type, length, format constraints
- Return clear error messages (without system details)

### Rate Limiting

- Implement per-user rate limits for login attempts (Supabase Auth handles this)
- Consider rate limits for API endpoints in future phases
- Monitor for abuse patterns in logs

### CORS & CSP

- CORS configured by Supabase Auth (no manual headers needed)
- Content Security Policy not yet needed (Phase 0); add before Phase 1
- Do not disable security headers to fix issues; fix the underlying cause

## Dependency Security

### Management

- Use `npm audit` to scan for vulnerabilities
- Review and understand new dependencies before adding
- Avoid unmaintained or rarely-updated packages
- Check licenses for compatibility

### Practices

- Keep dependencies up-to-date
- Use lock file (`package-lock.json`) for reproducible installs
- Review dependency changes in PRs
- Do not `npm install` with `--force` or `--legacy-peer-deps` in production

### Vulnerable Dependencies

- Run `npm audit` before deployment
- Fix high/critical vulnerabilities before merging
- Document why medium/low vulnerabilities are accepted (if any)
- Monitor for new advisories after deployment

## Secrets Management

### Environment Variables

**Safe (in `.env.example` and Vercel):**

- `NEXT_PUBLIC_SUPABASE_URL` (Supabase endpoint URL, no credentials)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, read-only key)

**Sensitive (Vercel secrets only, never in code):**

- `OPENAI_API_KEY` (when added)
- OAuth secrets

### Accessing Secrets

**From Server Code:**

```typescript
// OK: Use environment variable in server action
const apiKey = process.env.OPENAI_API_KEY;
```

**From Browser Code:**

```typescript
// NEVER: Service-role key would expose all data
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // ❌ Not exposed
```

**Build-Time Validation:**

- Validate that required environment variables exist at build time
- Use `validateEnvironment()` in `src/lib/validation/env.ts`
- Fail the build (not runtime) if configuration is invalid

## Monitoring & Logging

### What to Log

- Errors with error IDs for correlation
- Authentication events (login attempts, failures)
- Authorization failures (user tried to access data they don't own)
- Data changes (audit trail, if required)

### What Not to Log

- Full request bodies (especially with sensitive fields)
- Authentication tokens or sessions
- API keys, credentials, or secrets
- Full exception stack traces in user-facing logs

### Log Destinations

- Structured logs (JSON) for machine parsing
- Separate public error messages from detailed logs
- Do not send full logs to external services yet (Phase 0+1 local logging only)
- Sanitize logs before external export

## Incident Response

### Security Issues

- **Report privately**: Do not open public GitHub issues for security vulnerabilities
- Contact maintainers with details
- Do not disclose details publicly until patch is released

### Breaches or Exposure

- **Act immediately**: Stop deployment, identify scope, rotate credentials
- **Contain**: Limit access, revoke exposed credentials
- **Fix**: Patch the vulnerability
- **Communicate**: Notify affected users of what happened and what you did
- **Document**: Post-incident review to prevent recurrence

## Privacy Model

### Data Collection

- Collect only information necessary for instruction and operations
- Obtain consent for any information collection beyond necessity
- Document what information is collected and why

### Data Retention

- Keep data as long as needed for operational and legal reasons
- Delete archived student records after 7 years (adjust per policy)
- Retain logs for debugging (14 days typical)

### Data Access

- Only tutors access their own students' data (via RLS)
- Parents/students do not access operational notes (separate data)
- System administrators can access all data (log these accesses)

### Data Export & Deletion

- Design schema to enable future user data export
- Plan for cascading deletes (student deletion → related records)
- Ensure backups don't prevent deletion (handle via retention policy)

## Compliance & Legal

### FERPA (Family Educational Rights & Privacy Act)

- If students are minors or rely on FERPA coverage:
  - Maintain detailed access logs
  - Enable parent/student access to records (future feature)
  - Limit third-party access strictly
  - Document your policies

### GDPR (if EU users)

- Enable data subject access request workflow
- Implement right to deletion
- Document data processing
- Use privacy-respecting analytics only

### State Privacy Laws (CCPA, etc.)

- Audit applicability to your jurisdiction
- Implement corresponding user controls
- Document your privacy practices

## Testing Security

### Code Review

- Every PR review includes security check
- Look for: hardcoded secrets, missing validation, authorization bypass
- Verify RLS policies are correct

### Automated Scanning

- GitHub secret scanning (detects leaked credentials)
- Dependency scanning (`npm audit`)
- SAST tools (linting rules for security patterns)

### Manual Testing

- Test authentication: Can I log in? Can I access protected pages?
- Test authorization: Can I access other users' data? (Should be blocked by RLS)
- Test input validation: What happens with malicious input?
- Test data exposure: Is sensitive data in logs, error messages, or network traffic?

## Deployment Security

### Environment Validation

- Confirm all required environment variables are set
- Never deploy with placeholder credentials
- Verify RLS policies are active in production database

### Access Control

- Limit who can deploy (GitHub branch protection)
- Require approval for production pushes
- Use deployment logs to audit who deployed what

### Rollback Safety

- Ensure database rollback doesn't cause data loss
- Test rollback procedure in staging
- Keep previous version deployed and ready for immediate rollback

## Future: AI Security (Phase 3+)

When implementing AI features:

- **Prompt injection**: Validate user input to prevent prompt manipulation
- **Data leakage**: Don't send sensitive student data to third-party AI APIs
- **Output validation**: Parse AI output as untrusted input (Zod schema)
- **Auditing**: Log what was sent to AI and what was returned
- **Deletion**: When student data is deleted, ensure AI doesn't retain it

## Questions & Escalation

- Uncertain about security: Ask before implementing
- Found vulnerability: Report privately to maintainers
- Need exception to policy: Document rationale and get explicit approval

---

**Last Updated**: 2025-08-05
**Phase**: 0 (Foundation)
