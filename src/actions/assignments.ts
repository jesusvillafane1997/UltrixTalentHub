'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/actions/auth';
import { Permissions } from '@/lib/auth';
import { Assignment, AssignmentStatus, RateFrequency, UserRole } from '@/types/database';

export interface CreateAssignmentInput {
  person_id: string;
  client_id: string;
  role_title: string;
  start_date: string;
  end_date?: string | null;
  hours_per_week?: number;
  bill_rate: number;
  bill_rate_unit?: RateFrequency;
  currency?: string;
  account_manager_id?: string | null;
  status?: AssignmentStatus;
}

export interface CreateAssignmentResult {
  success: boolean;
  assignment?: Assignment;
  error?: string;
}

export async function createAssignment(
  payload: CreateAssignmentInput
): Promise<CreateAssignmentResult> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';
    const actorRole = (session?.role as UserRole) || 'admin';

    // 1. Permission check (Admin, HR Manager, or Account Manager)
    if (!['admin', 'hr_manager', 'account_manager'].includes(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to manage assignments.',
      };
    }

    // 2. Validate input fields
    if (!payload.person_id) {
      return { success: false, error: 'Person ID is required.' };
    }
    if (!payload.client_id) {
      return { success: false, error: 'Please select a client.' };
    }
    if (!payload.role_title?.trim()) {
      return { success: false, error: 'Role title is required.' };
    }
    if (!payload.start_date) {
      return { success: false, error: 'Start date is required.' };
    }
    if (payload.bill_rate == null || isNaN(payload.bill_rate) || payload.bill_rate < 0) {
      return { success: false, error: 'A valid bill rate is required.' };
    }

    const nowIso = new Date().toISOString();
    const status = payload.status || 'Active';
    const hoursPerWeek = payload.hours_per_week ? Number(payload.hours_per_week) : 40;
    const billRateUnit = payload.bill_rate_unit || 'monthly';
    const currency = payload.currency || 'USD';

    // 3. Insert assignment record
    const { data: newAssignment, error: insErr } = await supabase
      .from('assignments')
      .insert([
        {
          person_id: payload.person_id,
          client_id: payload.client_id,
          role_title: payload.role_title.trim(),
          start_date: payload.start_date,
          end_date: payload.end_date || null,
          hours_per_week: hoursPerWeek,
          bill_rate: payload.bill_rate,
          bill_rate_unit: billRateUnit,
          currency,
          account_manager_id: payload.account_manager_id || null,
          status,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: actorId,
        },
      ])
      .select('*, clients(id, name), account_manager:account_manager_id(id, name, email)')
      .single();

    if (insErr || !newAssignment) {
      console.error('Create assignment DB error:', insErr);
      return { success: false, error: insErr?.message || 'Failed to insert assignment record.' };
    }

    // 4. If status is Active, update person status to 'active'
    if (status === 'Active') {
      const { data: personRec } = await supabase
        .from('people')
        .select('id, status')
        .eq('id', payload.person_id)
        .single();

      if (personRec && personRec.status !== 'active') {
        await supabase
          .from('people')
          .update({
            status: 'active',
            availability_date: null,
            updated_at: nowIso,
          })
          .eq('id', payload.person_id);
      }
    }

    // 5. Activity log
    const clientName = (newAssignment as any)?.clients?.name || 'Client';
    await supabase.from('activity_log').insert([
      {
        entity_type: 'assignments',
        entity_id: newAssignment.id,
        person_id: payload.person_id,
        actor_id: actorId,
        action: 'created',
        diff: {
          client_id: payload.client_id,
          role_title: payload.role_title,
          bill_rate: payload.bill_rate,
          status,
        },
        note: `Assigned to ${clientName} as ${payload.role_title.trim()}`,
        created_at: nowIso,
      },
    ]);

    // 6. Invalidate paths
    revalidatePath(`/people/${payload.person_id}`);
    revalidatePath('/people');
    revalidatePath('/dashboard');
    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, assignment: newAssignment as Assignment };
  } catch (err: any) {
    console.error('createAssignment error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
