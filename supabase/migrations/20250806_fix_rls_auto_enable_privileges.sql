-- Fix rls_auto_enable() function security privileges
-- The rls_auto_enable function is a SECURITY DEFINER event trigger helper
-- that should only be called by the PostgreSQL event trigger system,
-- not by any client applications (including anon/authenticated users).
-- This migration revokes EXECUTE from PUBLIC role while preserving the
-- postgres role's ability to execute it (needed for the event trigger).

-- Before: PUBLIC, postgres, and event trigger could execute
-- After: Only postgres and event trigger can execute
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Verify: postgres role should still have execute privilege
-- SELECT has_function_privilege('postgres', 'public.rls_auto_enable()', 'EXECUTE');
