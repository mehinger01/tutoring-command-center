import { describe, it, expect } from 'vitest';
import {
  createStudentSchema,
  updateStudentSchema,
  createIntakeSchema,
  createSessionSchema,
} from '../students';

describe('Student Validation', () => {
  describe('createStudentSchema', () => {
    it('accepts valid student data', () => {
      const valid = {
        first_name: 'John',
        last_name: 'Doe',
        preferred_name: 'Johnny',
        status: 'active' as const,
        grade_level: '10',
        school_name: 'Lincoln High',
        tutoring_type: ['Math', 'Science'],
        subjects: ['Algebra', 'Biology'],
        parent_guardian_name: 'Jane Doe',
        parent_guardian_email: 'jane@example.com',
        parent_guardian_phone: '555-1234',
        student_email: 'john@example.com',
        current_priorities: 'Improve grades',
        scheduling_notes: 'After 3 PM',
        tutor_notes: 'Quick learner',
        student_site_url: 'https://example.com',
        github_repo_url: 'https://github.com/user/repo',
        external_platform_notes: 'On Canvas',
        start_date: new Date('2026-08-10'),
      };

      const result = createStudentSchema.parse(valid);
      expect(result.first_name).toBe('John');
      expect(result.status).toBe('active');
    });

    it('requires first_name', () => {
      const invalid = {
        last_name: 'Doe',
      };

      expect(() => createStudentSchema.parse(invalid)).toThrow();
    });

    it('allows minimal data with only first_name', () => {
      const minimal = {
        first_name: 'Jane',
      };

      const result = createStudentSchema.parse(minimal);
      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBeUndefined();
    });

    it('validates email addresses', () => {
      const invalid = {
        first_name: 'John',
        parent_guardian_email: 'invalid-email',
      };

      expect(() => createStudentSchema.parse(invalid)).toThrow();
    });

    it('validates URLs', () => {
      const invalid = {
        first_name: 'John',
        student_site_url: 'not-a-url',
      };

      expect(() => createStudentSchema.parse(invalid)).toThrow();
    });

    it('validates status enum', () => {
      const invalid = {
        first_name: 'John',
        status: 'invalid',
      };

      expect(() => createStudentSchema.parse(invalid)).toThrow();
    });

    it('defaults status to intake', () => {
      const data = {
        first_name: 'John',
      };

      const result = createStudentSchema.parse(data);
      expect(result.status).toBe('intake');
    });
  });

  describe('updateStudentSchema', () => {
    it('allows partial updates', () => {
      const partial = {
        preferred_name: 'Johnny',
        grade_level: '11',
      };

      const result = updateStudentSchema.parse(partial);
      expect(result.preferred_name).toBe('Johnny');
      expect(result.grade_level).toBe('11');
    });

    it('allows empty object', () => {
      const empty = {};
      const result = updateStudentSchema.parse(empty);
      expect(result).toEqual({});
    });
  });

  describe('Intake Validation', () => {
    it('accepts valid intake data', () => {
      const valid = {
        referral_source: 'School counselor',
        parent_concerns: 'Behind in math',
        student_concerns: 'Frustrated with homework',
        academic_needs: 'Algebra support',
        executive_function_needs: 'Organization help',
        student_interests: 'Video games, music',
        accommodations: 'Extended time on tests',
        initial_goals: 'Pass algebra class',
        assessment_plan: 'Weekly quizzes',
        package_notes: '2x weekly, 1 hour sessions',
        scheduling_expectations: 'Afternoons preferred',
      };

      const result = createIntakeSchema.parse(valid);
      expect(result.initial_goals).toBe('Pass algebra class');
    });

    it('allows all optional fields', () => {
      const minimal = {};
      const result = createIntakeSchema.parse(minimal);
      expect(result).toEqual({});
    });
  });

  describe('Session Validation', () => {
    it('accepts valid session data', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 3600000);

      const valid = {
        scheduled_start: start,
        scheduled_end: end,
        status: 'planned' as const,
        planned_focus: 'Chapter 5 review',
        actual_focus: 'Covered questions 1-10',
        pre_session_notes: 'Bring textbook',
        session_notes: 'Good progress',
        parent_summary: 'Completed practice problems',
        next_steps: 'Read chapter 6',
        follow_up_tasks: 'Homework questions',
        lesson_url: 'https://example.com/lesson',
        duration_minutes: 60,
      };

      const result = createSessionSchema.parse(valid);
      expect(result.planned_focus).toBe('Chapter 5 review');
    });

    it('requires scheduled_start and scheduled_end', () => {
      const invalid = {
        status: 'planned',
      };

      expect(() => createSessionSchema.parse(invalid)).toThrow();
    });

    it('validates end time is after start time', () => {
      const start = new Date();
      const endBefore = new Date(start.getTime() - 3600000);

      const invalid = {
        scheduled_start: start,
        scheduled_end: endBefore,
      };

      expect(() => createSessionSchema.parse(invalid)).toThrow();
    });

    it('validates session status enum', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 3600000);

      const invalid = {
        scheduled_start: start,
        scheduled_end: end,
        status: 'invalid',
      };

      expect(() => createSessionSchema.parse(invalid)).toThrow();
    });

    it('validates positive duration minutes', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 3600000);

      const invalid = {
        scheduled_start: start,
        scheduled_end: end,
        duration_minutes: -30,
      };

      expect(() => createSessionSchema.parse(invalid)).toThrow();
    });

    it('allows all optional fields except required dates', () => {
      const start = new Date();
      const end = new Date(start.getTime() + 3600000);

      const minimal = {
        scheduled_start: start,
        scheduled_end: end,
      };

      const result = createSessionSchema.parse(minimal);
      expect(result.scheduled_start).toEqual(start);
    });
  });
});
