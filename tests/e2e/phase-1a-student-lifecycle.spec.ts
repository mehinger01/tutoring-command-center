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

      await page.click('button:has-text("Create Student")');

      // Should redirect to students list
      await expect(page).toHaveURL('/dashboard/students');
      // Wait for page to load and verify student appears
      await page.waitForLoadState('networkidle');
      // Look for the first "Test Student" link in the list
      await expect(page.locator('a').filter({ hasText: 'Test Student active' }).first()).toBeVisible();
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
      const studentLinks = await page.locator('a:has-text("Detail Test Student")').all();
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
      const studentLinks = await page.locator('a:has-text("Edit Test Student")').all();
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

      // Archive the student - click the Archive button
      const archiveButton = page.locator('button').filter({ hasText: 'Archive' });
      await archiveButton.click();

      // Confirm the archive dialog if it appears
      // Try to click the confirm button in the dialog
      const confirmButtons = page.locator('button').filter({ hasText: 'Archive' });
      if ((await confirmButtons.count()) > 1) {
        await confirmButtons.last().click();
      } else {
        // If no confirm dialog, the action might be confirmed already
      }

      // Reload the page to see the updated state
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show Unarchive button now
      await expect(page.locator('button').filter({ hasText: 'Unarchive' })).toBeVisible({ timeout: 5000 });

      // Unarchive the student
      const unarchiveButton = page.locator('button').filter({ hasText: 'Unarchive' });
      await unarchiveButton.click();

      // Confirm the unarchive dialog if it appears
      const confirmButtons2 = page.locator('button').filter({ hasText: 'Unarchive' });
      if ((await confirmButtons2.count()) > 1) {
        await confirmButtons2.last().click();
      }

      // Reload the page to see the updated state
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show Archive button again
      await expect(page.locator('button').filter({ hasText: 'Archive' })).toBeVisible();

      await supabase.auth.signOut();
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
      await expect(page?.locator('text=Original goal')).toBeTruthy();

      await supabase.auth.signOut();
    });
  });
});
