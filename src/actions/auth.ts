'use server';

import { cookies } from 'next/headers';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { User, UserRole } from '@/types/database';

const DEFAULT_PIN = 'ultrix2026';

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function loginUser(email: string, password?: string): Promise<LoginResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email is required.' };
    }

    const supabase = await createServerSupabaseClient();

    // If Supabase Auth password verification is provided
    if (password && password.length >= 6 && password !== DEFAULT_PIN) {
      try {
        const { data: authRes } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authRes?.user) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (dbUser) {
            const cookieStore = await cookies();
            cookieStore.set('ultrix_session', JSON.stringify(dbUser), {
              path: '/',
              maxAge: 60 * 60 * 24 * 7,
              sameSite: 'lax',
              httpOnly: false,
            });
            return { success: true, user: dbUser };
          }
        }
      } catch {
        // Fallback to table lookup
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('Supabase user lookup error:', error.message);
      return { success: false, error: 'Database error looking up user account.' };
    }

    if (!user) {
      return {
        success: false,
        error: `No account found for "${cleanEmail}". Click "Create Account" to register.`,
      };
    }

    // Set auth session cookie
    const cookieStore = await cookies();
    cookieStore.set('ultrix_session', JSON.stringify(user), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      httpOnly: false,
    });

    return {
      success: true,
      user,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed.' };
  }
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}): Promise<RegisterResult> {
  try {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name.trim();
    const role = payload.role || 'viewer';

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Full name is required (minimum 2 characters).' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: 'A valid email address is required.' };
    }

    const supabase = createAdminSupabaseClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists. Please switch to Log In.',
      };
    }

    let authId: string | null = null;
    if (payload.password && payload.password.length >= 6) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: cleanEmail,
          password: payload.password,
          options: {
            data: { name: cleanName, role },
          },
        });
        authId = authData?.user?.id || null;
      } catch (authErr: any) {
        console.warn('Supabase auth signup notice:', authErr?.message);
      }
    }

    const userId = authId || crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const newUser: User = {
      id: userId,
      auth_id: authId,
      email: cleanEmail,
      name: cleanName,
      role,
      avatar_url: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { error: insertErr } = await supabase.from('users').insert([newUser]);
    if (insertErr) {
      console.error('Error inserting user into DB:', insertErr);
      if (insertErr.message?.includes('users_email_check')) {
        return {
          success: false,
          error:
            'Internal staff emails must end in @ultrix.digital (e.g., yourname@ultrix.digital). To allow any email domain (such as @gmail.com), run "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_check;" in your Supabase SQL editor.',
        };
      }
      return { success: false, error: `Failed to create user profile: ${insertErr.message}` };
    }

    // Set auth session cookie immediately
    const cookieStore = await cookies();
    cookieStore.set('ultrix_session', JSON.stringify(newUser), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      httpOnly: false,
    });

    return {
      success: true,
      user: newUser,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create user.' };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('ultrix_session');
  return { success: true };
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ultrix_session');
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value) as User;
  } catch {
    return null;
  }
}

export async function getStaffUsers(): Promise<User[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) {
      console.warn('Failed to load users from DB, returning empty:', error?.message);
      return [];
    }
    return data as User[];
  } catch (err) {
    console.error('getStaffUsers error:', err);
    return [];
  }
}
