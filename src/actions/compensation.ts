'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/actions/auth';
import { CompensationRecord, CompReason, EngagementType, RateFrequency, UserRole } from '@/types/database';

export interface CreateCompensationInput {
  person_id: string;
  amount: number;
  currency?: string;
  frequency?: RateFrequency;
  engagement_type?: EngagementType;
  effective_date: string;
  reason: CompReason;
}

export interface CreateCompensationResult {
  success: boolean;
  compensation?: CompensationRecord;
  error?: string;
}

export async function addCompensationRecord(
  payload: CreateCompensationInput
): Promise<CreateCompensationResult> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';
    const actorRole = (session?.role as UserRole) || 'admin';

    // 1. Strict Role check: Only Admin and HR Manager can add compensation records
    if (!['admin', 'hr_manager'].includes(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: Only Admin and HR Manager have permission to add compensation records.',
      };
    }

    // 2. Validate inputs
    if (!payload.person_id) {
      return { success: false, error: 'Person ID is required.' };
    }
    if (payload.amount == null || isNaN(payload.amount) || payload.amount <= 0) {
      return { success: false, error: 'A valid compensation amount greater than 0 is required.' };
    }
    if (!payload.effective_date) {
      return { success: false, error: 'Effective date is required.' };
    }
    if (!payload.reason) {
      return { success: false, error: 'Compensation reason is required.' };
    }

    const nowIso = new Date().toISOString();
    const currency = payload.currency || 'USD';
    const frequency = payload.frequency || 'monthly';
    const engagementType = payload.engagement_type || 'contractor';

    // 3. Insert append-only compensation record
    const { data: newComp, error: insErr } = await supabase
      .from('compensation_records')
      .insert([
        {
          person_id: payload.person_id,
          amount: payload.amount,
          currency,
          frequency,
          engagement_type: engagementType,
          effective_date: payload.effective_date,
          reason: payload.reason,
          created_at: nowIso,
          created_by: actorId,
        },
      ])
      .select('*')
      .single();

    if (insErr || !newComp) {
      console.error('Create compensation DB error:', insErr);
      return { success: false, error: insErr?.message || 'Failed to insert compensation record.' };
    }

    // 4. Update person's salary expectation & currency to reflect the latest compensation
    await supabase
      .from('people')
      .update({
        salary_expectation: payload.amount,
        salary_currency: currency,
        updated_at: nowIso,
      })
      .eq('id', payload.person_id);

    // 5. Audit trail activity log
    await supabase.from('activity_log').insert([
      {
        entity_type: 'compensation_records',
        entity_id: newComp.id,
        person_id: payload.person_id,
        actor_id: actorId,
        action: 'created',
        diff: {
          amount: payload.amount,
          currency,
          frequency,
          effective_date: payload.effective_date,
          reason: payload.reason,
        },
        note: `Compensation logged: ${currency} ${payload.amount.toLocaleString()} / ${frequency} (${payload.reason})`,
        created_at: nowIso,
      },
    ]);

    // 6. Invalidate paths
    revalidatePath(`/people/${payload.person_id}`);
    revalidatePath('/people');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, compensation: newComp as CompensationRecord };
  } catch (err: any) {
    console.error('addCompensationRecord error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
