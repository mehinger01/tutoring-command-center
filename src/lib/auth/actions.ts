'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (err) {
    console.error('Sign up error:', err);
    return { error: 'Failed to sign up. Please try again.' };
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (err) {
    console.error('Sign in error:', err);
    return { error: 'Failed to sign in. Please try again.' };
  }

  // Redirect after successful authentication, outside try/catch
  // so Next.js redirect exception is not intercepted
  redirect('/dashboard');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();

  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Sign out error:', err);
  }

  // Redirect after sign out, outside try/catch
  // so Next.js redirect exception is not intercepted
  redirect('/auth/login');
}

export async function getAuthUser() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch (err) {
    console.error('Get user error:', err);
    return null;
  }
}
