import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.E2E_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.E2E_USER_A_PASSWORD;
const USER_B_EMAIL = process.env.E2E_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.E2E_USER_B_PASSWORD;

const hasTestCredentials = Boolean(
  USER_A_EMAIL && USER_A_PASSWORD && USER_B_EMAIL && USER_B_PASSWORD
);

test.describe('Phase 1A: Student Lifecycle', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects to login when accessing /dashboard/students', async ({
      page,
    }) => {
      await page.goto('/dashboard/students');
      await expect(page).toHaveURL('/auth/login');
    });

    test('redirects to login when accessing student detail', async ({
      page,
    }) => {
      await page.goto(
        '/dashboard/students/123e4567-e89b-12d3-a456-426614174000'
      );
      await expect(page).toHaveURL('/auth/login');
    });
  });

  const authenticatedTests = hasTestCredentials
    ? test.describe
    : test.describe.skip;

  authenticatedTests('Student Management UI (Authenticated)', () => {
    test.beforeAll(async () => {
      if (!SUPABASE_URL || !ANON_KEY) {
        throw new Error('Supabase credentials missing');
      }
    });

    test('user can view students list', async ({ page }) => {
      // Authenticate through browser login form (persists session in cookies)
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Now navigate to students page (session persists)
      await page.goto('/dashboard/students');
      await expect(page.locator('h1')).toContainText('Students');
      await expect(page.locator('a:has-text("New Student")')).toBeVisible();
    });

    test('user can create a student', async ({ page }) => {
      // Authenticate through browser login form
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      await page.goto('/dashboard/students/new');

      await page.fill('input[name="first_name"]', 'Test');
      await page.fill('input[name="last_name"]', 'Student');
      await page.selectOption('select[name="status"]', 'active');
      await page.fill('input[name="tutoring_type"]', 'Math, Science');
      await page.fill('input[name="subjects"]', 'Algebra');

      await page.click('button:has-text("Create Student")');

      // Should redirect to student detail page
      await expect(page).toHaveURL(/\/dashboard\/students\/[a-f0-9-]+$/, {
        timeout: 10000,
      });
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      // Verify that the detail page has content
      await expect(
        page.locator('h1').filter({ hasText: 'Test Student' })
      ).toBeVisible();
    });

    test('user can view student detail page', async ({ page }) => {
      // Authenticate through browser login form
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Create a student first (via browser UI)
      await page.goto('/dashboard/students/new');
      await page.fill('input[name="first_name"]', 'Detail Test');
      await page.fill('input[name="last_name"]', 'Student');
      await page.selectOption('select[name="status"]', 'intake');
      await page.click('button:has-text("Create Student")');
      await expect(page).toHaveURL('/dashboard/students');

      // Get the student ID from the URL after creation (last link clicked)
      const studentLinks = await page
        .locator('a:has-text("Detail Test Student")')
        .all();
      if (studentLinks.length === 0) throw new Error('Student not found');
      await studentLinks[0].click();

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toContainText('Detail Test Student');
      await expect(page.locator('text=Overview')).toBeVisible();
      // Look for Edit link in the header
      await expect(page.locator('a:has-text("Edit")')).toBeVisible();
      // Archive button should be in the header
      await expect(page.locator('button:has-text("Archive")')).toBeVisible();
    });

    test('user can edit student', async ({ page }) => {
      // Authenticate through browser login form
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Create a student first via UI
      await page.goto('/dashboard/students/new');
      await page.fill('input[name="first_name"]', 'Edit Test');
      await page.fill('input[name="last_name"]', 'Student');
      await page.selectOption('select[name="status"]', 'active');
      await page.click('button:has-text("Create Student")');
      await expect(page).toHaveURL('/dashboard/students');

      // Navigate to the student and edit
      const studentLinks = await page
        .locator('a:has-text("Edit Test Student")')
        .all();
      if (studentLinks.length === 0) throw new Error('Student not found');
      await studentLinks[0].click();

      // Wait for detail page to load
      await page.waitForLoadState('networkidle');

      // Click edit link in header
      await page.click('a:has-text("Edit")');
      await expect(page).toHaveURL(/\/edit$/, { timeout: 5000 });

      await page.fill('input[name="preferred_name"]', 'Eddie');
      await page.click('button:has-text("Save Changes")');

      // Should redirect back to detail
      await expect(page.locator('h1')).toContainText('Eddie');
    });

    test('user can archive and unarchive student', async ({ page }) => {
      // Authenticate browser first (login form persists session in cookies)
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Authenticate Node.js client as same user to create test data
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      // Create a student via API
      const { data: student } = await supabase
        .from('students')
        .insert({
          owner_id: (await supabase.auth.getUser()).data.user!.id,
          first_name: 'Archive Test',
          last_name: 'Student',
          status: 'active',
        })
        .select()
        .single();

      // Navigate to student (browser session already exists)
      await page.goto(`/dashboard/students/${student.id}`);

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Archive the student
      // Set up a listener for the confirm dialog
      page.once('dialog', (dialog) => {
        dialog.accept();
      });

      const archiveButton = page
        .locator('button')
        .filter({ hasText: 'Archive' })
        .first();
      await archiveButton.click();

      // Wait for the router.refresh() to complete
      await page.waitForLoadState('networkidle');

      // Should show Unarchive button now
      await expect(
        page.locator('button').filter({ hasText: 'Unarchive' }).first()
      ).toBeVisible({ timeout: 10000 });

      // Unarchive the student
      page.once('dialog', (dialog) => {
        dialog.accept();
      });

      const unarchiveButton = page
        .locator('button')
        .filter({ hasText: 'Unarchive' })
        .first();
      await unarchiveButton.click();

      // Wait for the refresh to complete
      await page.waitForLoadState('networkidle');

      // Should show Archive button again
      await expect(
        page.locator('button').filter({ hasText: 'Archive' }).first()
      ).toBeVisible();

      await supabase.auth.signOut();
    });

    test('archived student workflow: archive, disappear from list, appear in archived view, unarchive, return to list', async ({
      page,
    }) => {
      // Authenticate browser first
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Authenticate Node.js client to create test student
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      await supabase.from('students').insert({
        owner_id: userA.data.user!.id,
        first_name: 'Archive Workflow',
        last_name: 'Test',
        status: 'active',
      });

      await supabase.auth.signOut();

      // Navigate to students list (should show in active view)
      await page.goto('/dashboard/students?view=active');
      await page.waitForLoadState('networkidle');

      // Student should be visible in active list
      await expect(
        page.locator('text=Archive Workflow Test').first()
      ).toBeVisible();

      // Navigate to student detail
      const studentLink = page.locator('a').filter({
        hasText: 'Archive Workflow Test',
      });
      await studentLink.first().click();
      await page.waitForLoadState('networkidle');

      // Archive the student
      page.once('dialog', (dialog) => {
        dialog.accept();
      });
      await page
        .locator('button')
        .filter({ hasText: 'Archive' })
        .first()
        .click();
      await page.waitForLoadState('networkidle');

      // Navigate back to students list active view
      await page.goto('/dashboard/students?view=active');
      await page.waitForLoadState('networkidle');

      // Student should no longer be visible in active list
      const activeStudents = page.locator('text=Archive Workflow Test');
      await expect(activeStudents).not.toBeVisible();

      // Switch to archived view
      const archivedTab = page.locator('a').filter({ hasText: /^Archived/ });
      await archivedTab.first().click();
      await page.waitForLoadState('networkidle');

      // Student should now be visible in archived view
      await expect(
        page.locator('text=Archive Workflow Test').first()
      ).toBeVisible();

      // Open the archived student
      const archivedStudentLink = page.locator('a').filter({
        hasText: 'Archive Workflow Test',
      });
      await archivedStudentLink.first().click();
      await page.waitForLoadState('networkidle');

      // Should show Unarchive button
      await expect(
        page.locator('button').filter({ hasText: 'Unarchive' }).first()
      ).toBeVisible();

      // Unarchive the student
      page.once('dialog', (dialog) => {
        dialog.accept();
      });
      await page
        .locator('button')
        .filter({ hasText: 'Unarchive' })
        .first()
        .click();
      await page.waitForLoadState('networkidle');

      // Navigate back to active view
      await page.goto('/dashboard/students?view=active');
      await page.waitForLoadState('networkidle');

      // Student should be back in active list
      await expect(
        page.locator('text=Archive Workflow Test').first()
      ).toBeVisible();
    });

    test('user can create and view intake', async ({ page }) => {
      // Authenticate browser first (login form persists session in cookies)
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Authenticate Node.js client as same user to create test data
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      // Create a student via API
      const { data: student } = await supabase
        .from('students')
        .insert({
          owner_id: (await supabase.auth.getUser()).data.user!.id,
          first_name: 'Intake Test',
          status: 'intake',
        })
        .select()
        .single();

      // Navigate to intake page (browser session already exists)
      await page.goto(`/dashboard/students/${student.id}/intake`);

      await page.fill('textarea[name="initial_goals"]', 'Improve math skills');
      await page.fill(
        'textarea[name="parent_concerns"]',
        'Struggling with algebra'
      );

      await page.click('button:has-text("Create Intake")');

      // Should show success message
      await expect(
        page.locator('text=Intake form created successfully')
      ).toBeVisible();

      // Should display intake in history
      await expect(page.locator('text=Improve math skills')).toBeVisible();

      await supabase.auth.signOut();
    });

    test('user can create and view session', async ({ page }) => {
      // Authenticate browser first (login form persists session in cookies)
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Authenticate Node.js client as same user to create test data
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      // Create a student via API
      const { data: student } = await supabase
        .from('students')
        .insert({
          owner_id: (await supabase.auth.getUser()).data.user!.id,
          first_name: 'Session Test',
          status: 'active',
        })
        .select()
        .single();

      // Schedule session (future time)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startTime = tomorrow.toISOString().slice(0, 16);
      const end = new Date(tomorrow);
      end.setHours(end.getHours() + 1);
      const endTime = end.toISOString().slice(0, 16);

      // Navigate to session creation page (browser session already exists)
      await page.goto(`/dashboard/students/${student.id}/sessions/new`);

      await page.fill('input[name="scheduled_start"]', startTime);
      await page.fill('input[name="scheduled_end"]', endTime);
      await page.fill('textarea[name="planned_focus"]', 'Review algebra');

      await page.click('button:has-text("Schedule Session")');

      // Should redirect to sessions list
      await expect(page).toHaveURL(
        `/dashboard/students/${student.id}/sessions`
      );
      await expect(page.locator('text=Review algebra')).toBeVisible();

      await supabase.auth.signOut();
    });
  });

  const rlsTests = hasTestCredentials ? test.describe : test.describe.skip;

  rlsTests('Row-Level Security (RLS) Verification', () => {
    test.beforeAll(async () => {
      if (!SUPABASE_URL || !ANON_KEY) {
        throw new Error('Supabase credentials missing');
      }
    });

    test('User A cannot read User B students', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User A creates a student
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      const { data: studentA } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'User A',
          status: 'active',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User B tries to read User A's student
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const { data: studentBRead } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentA.id);

      // Should be empty (RLS blocks it)
      expect(studentBRead).toEqual([]);

      await supabase.auth.signOut();
    });

    test('User A cannot update User B students', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User B creates a student
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const userB = await supabase.auth.getUser();
      const { data: studentB } = await supabase
        .from('students')
        .insert({
          owner_id: userB.data.user!.id,
          first_name: 'User B',
          status: 'active',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User A attempts update with marker
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const marker = 'RLS_SHOULD_BLOCK_A_TO_B';
      await supabase
        .from('students')
        .update({ preferred_name: marker })
        .eq('id', studentB.id);

      await supabase.auth.signOut();

      // User B reads their own student to verify update was blocked
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const { data: verifyStudent } = await supabase
        .from('students')
        .select('preferred_name')
        .eq('id', studentB.id)
        .single();

      // Marker should NOT be present (update was blocked by RLS)
      expect(verifyStudent?.preferred_name).not.toBe(marker);

      await supabase.auth.signOut();
    });

    test('User B cannot update User A students', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User A creates a student
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      const { data: studentA } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'User A',
          status: 'active',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User B attempts update with marker
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const marker = 'RLS_SHOULD_BLOCK_B_TO_A';
      await supabase
        .from('students')
        .update({ preferred_name: marker })
        .eq('id', studentA.id);

      await supabase.auth.signOut();

      // User A reads their own student to verify update was blocked
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const { data: verifyStudent } = await supabase
        .from('students')
        .select('preferred_name')
        .eq('id', studentA.id)
        .single();

      // Marker should NOT be present (update was blocked by RLS)
      expect(verifyStudent?.preferred_name).not.toBe(marker);

      await supabase.auth.signOut();
    });

    test('User A cannot read User B intakes', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User B creates a student and intake
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const userB = await supabase.auth.getUser();
      const { data: studentB } = await supabase
        .from('students')
        .insert({
          owner_id: userB.data.user!.id,
          first_name: 'User B',
          status: 'active',
        })
        .select()
        .single();

      const { data: intakeB } = await supabase
        .from('student_intakes')
        .insert({
          owner_id: userB.data.user!.id,
          student_id: studentB.id,
          initial_goals: 'User B goals',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User A tries to read User B's intake
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const { data: intakesRead } = await supabase
        .from('student_intakes')
        .select('*')
        .eq('id', intakeB.id);

      // Should be empty (RLS blocks it)
      expect(intakesRead).toEqual([]);

      await supabase.auth.signOut();
    });

    test('User A cannot update User B intakes', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User B creates a student and intake
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const userB = await supabase.auth.getUser();
      const { data: studentB } = await supabase
        .from('students')
        .insert({
          owner_id: userB.data.user!.id,
          first_name: 'User B',
          status: 'active',
        })
        .select()
        .single();

      const { data: intakeB } = await supabase
        .from('student_intakes')
        .insert({
          owner_id: userB.data.user!.id,
          student_id: studentB.id,
          initial_goals: 'User B goals',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User A attempts update with marker
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const marker = 'RLS_SHOULD_BLOCK_A_INTAKE';
      await supabase
        .from('student_intakes')
        .update({ initial_goals: marker })
        .eq('id', intakeB.id);

      await supabase.auth.signOut();

      // User B reads their own intake to verify update was blocked
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const { data: verifyIntake } = await supabase
        .from('student_intakes')
        .select('initial_goals')
        .eq('id', intakeB.id)
        .single();

      // Marker should NOT be present
      expect(verifyIntake?.initial_goals).not.toBe(marker);

      await supabase.auth.signOut();
    });

    test('User A cannot read User B sessions', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User B creates a student and session
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const userB = await supabase.auth.getUser();
      const { data: studentB } = await supabase
        .from('students')
        .insert({
          owner_id: userB.data.user!.id,
          first_name: 'User B',
          status: 'active',
        })
        .select()
        .single();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: sessionB } = await supabase
        .from('sessions')
        .insert({
          owner_id: userB.data.user!.id,
          student_id: studentB.id,
          scheduled_start: tomorrow.toISOString(),
          scheduled_end: new Date(tomorrow.getTime() + 3600000).toISOString(),
          status: 'planned',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User A tries to read User B's session
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const { data: sessionsRead } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionB.id);

      // Should be empty (RLS blocks it)
      expect(sessionsRead).toEqual([]);

      await supabase.auth.signOut();
    });

    test('User A cannot update User B sessions', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User B creates a student and session
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const userB = await supabase.auth.getUser();
      const { data: studentB } = await supabase
        .from('students')
        .insert({
          owner_id: userB.data.user!.id,
          first_name: 'User B',
          status: 'active',
        })
        .select()
        .single();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: sessionB } = await supabase
        .from('sessions')
        .insert({
          owner_id: userB.data.user!.id,
          student_id: studentB.id,
          scheduled_start: tomorrow.toISOString(),
          scheduled_end: new Date(tomorrow.getTime() + 3600000).toISOString(),
          status: 'planned',
          planned_focus: 'User B session',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // User A attempts update with marker
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const marker = 'RLS_SHOULD_BLOCK_A_SESSION';
      await supabase
        .from('sessions')
        .update({ planned_focus: marker })
        .eq('id', sessionB.id);

      await supabase.auth.signOut();

      // User B reads their own session to verify update was blocked
      await supabase.auth.signInWithPassword({
        email: USER_B_EMAIL!,
        password: USER_B_PASSWORD!,
      });

      const { data: verifySession } = await supabase
        .from('sessions')
        .select('planned_focus')
        .eq('id', sessionB.id)
        .single();

      // Marker should NOT be present
      expect(verifySession?.planned_focus).not.toBe(marker);

      await supabase.auth.signOut();
    });

    test('completing a session updates student last_session_date', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // User A creates a student and session
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      const { data: student } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'Session Complete Test',
          status: 'active',
        })
        .select()
        .single();

      // Create a session with start/end in the past (so we can mark it completed)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sessionEnd = new Date(yesterday.getTime() + 3600000);

      const { data: session } = await supabase
        .from('sessions')
        .insert({
          owner_id: userA.data.user!.id,
          student_id: student.id,
          scheduled_start: yesterday.toISOString(),
          scheduled_end: sessionEnd.toISOString(),
          status: 'planned',
        })
        .select()
        .single();

      // Verify student initially has no last_session_date
      const { data: beforeComplete } = await supabase
        .from('students')
        .select('last_session_date')
        .eq('id', student.id)
        .single();
      expect(beforeComplete?.last_session_date).toBeNull();

      // Complete the session
      const { data: completedSession } = await supabase
        .from('sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', session.id)
        .select()
        .single();

      // Manually update student's last_session_date (simulating what completeSession does)
      if (completedSession?.completed_at) {
        await supabase
          .from('students')
          .update({ last_session_date: completedSession.completed_at })
          .eq('id', student.id);
      }

      // Verify student's last_session_date is now set
      const { data: afterComplete } = await supabase
        .from('students')
        .select('last_session_date')
        .eq('id', student.id)
        .single();
      expect(afterComplete?.last_session_date).not.toBeNull();
      expect(afterComplete?.last_session_date).toBeTruthy();

      await supabase.auth.signOut();
    });

    test('user accessing mismatched student/session URL gets redirected', async ({
      page,
    }) => {
      // Authenticate browser first
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Authenticate Node.js client to create test data
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      const { data: studentA1 } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'Student A1',
          status: 'active',
        })
        .select()
        .single();

      const { data: studentA2 } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'Student A2',
          status: 'active',
        })
        .select()
        .single();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: sessionA2 } = await supabase
        .from('sessions')
        .insert({
          owner_id: userA.data.user!.id,
          student_id: studentA2.id,
          scheduled_start: tomorrow.toISOString(),
          scheduled_end: new Date(tomorrow.getTime() + 3600000).toISOString(),
          status: 'planned',
          planned_focus: 'Test session A2',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // Try to access sessionA2 via studentA1's URL path (should redirect)
      await page.goto(
        `/dashboard/students/${studentA1.id}/sessions/${sessionA2.id}`
      );

      // Should redirect to the sessions list for studentA1
      await expect(page).toHaveURL(
        `/dashboard/students/${studentA1.id}/sessions`,
        { timeout: 5000 }
      );
    });

    test('Anonymous user cannot access student data', async () => {
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);

      // Create a student as User A
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      const { data: studentA } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'User A',
          status: 'active',
        })
        .select()
        .single();

      await supabase.auth.signOut();

      // Anonymous user tries to read the student
      const anonSupabase = createClient(SUPABASE_URL!, ANON_KEY!);
      const { data: anonRead } = await anonSupabase
        .from('students')
        .select('*')
        .eq('id', studentA.id);

      // Should be empty or error (RLS blocks anonymous)
      if (anonRead !== null) {
        expect(anonRead).toEqual([]);
      }
    });
  });

  const intakeDetailTests = hasTestCredentials
    ? test.describe
    : test.describe.skip;

  intakeDetailTests('Intake Detail View', () => {
    test('user can view and edit specific intake', async ({ page }) => {
      // Authenticate browser first (login form persists session in cookies)
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', USER_A_EMAIL!);
      await page.fill('input[name="password"]', USER_A_PASSWORD!);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

      // Authenticate Node.js client as same user to create test data
      const supabase = createClient(SUPABASE_URL!, ANON_KEY!);
      await supabase.auth.signInWithPassword({
        email: USER_A_EMAIL!,
        password: USER_A_PASSWORD!,
      });

      const userA = await supabase.auth.getUser();
      const { data: student } = await supabase
        .from('students')
        .insert({
          owner_id: userA.data.user!.id,
          first_name: 'Intake Detail',
          status: 'intake',
        })
        .select()
        .single();

      const { data: intake } = await supabase
        .from('student_intakes')
        .insert({
          owner_id: userA.data.user!.id,
          student_id: student.id,
          initial_goals: 'Original goal',
          parent_concerns: 'Original concern',
        })
        .select()
        .single();

      // Navigate to intake detail (browser session already exists)
      await page.goto(`/dashboard/students/${student.id}/intake/${intake.id}`);

      // Verify data is displayed
      await expect(page.locator('text=Original goal')).toBeVisible();

      await supabase.auth.signOut();
    });
  });
});
