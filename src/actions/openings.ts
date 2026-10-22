'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/actions/auth';
import { Permissions } from '@/lib/auth';
import { Opening, SeniorityLevel, OpeningStatus, RejectionReason } from '@/types/database';

export interface CreateOpeningResult {
  success: boolean;
  openingId?: string;
  error?: string;
}

export async function createOpening(formData: FormData): Promise<CreateOpeningResult> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = (formData.get('actor_id') as string) || session?.id || '11111111-1111-1111-1111-111111111111';
    const actorRole = (formData.get('actor_role') as any) || session?.role || 'admin';

    if (!Permissions.canManageOpenings(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: You do not have permission to create or manage job openings.',
      };
    }

    const title = (formData.get('title') as string)?.trim();
    if (!title) {
      return { success: false, error: 'Job / Project title is required.' };
    }

    let clientId = (formData.get('client_id') as string)?.trim() || null;
    const quickClientName = (formData.get('quick_client_name') as string)?.trim();

    // If quick client creation requested or clientId is empty and quickClientName is provided
    if ((!clientId || clientId === 'new') && quickClientName) {
      const emailDomain = quickClientName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newClientRecord = {
        name: quickClientName,
        contact_name: `${quickClientName} Operations`,
        contact_email: `contact@${emailDomain || 'client'}.com`,
        timezone: (formData.get('client_timezone') as string) || 'America/New_York (EST)',
        active: true,
        created_by: actorId,
      };

      const { data: createdClient, error: clientErr } = await supabase
        .from('clients')
        .insert([newClientRecord])
        .select()
        .single();

      if (clientErr) {
        return { success: false, error: `Failed to create client: ${clientErr.message}` };
      }
      clientId = createdClient.id;
    }

    // If still no client_id, find or pick the first client, or create a default client
    if (!clientId) {
      const { data: existingClients } = await supabase.from('clients').select('id').limit(1);
      if (existingClients && existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        const { data: defaultClient, error: defClientErr } = await supabase
          .from('clients')
          .insert([
            {
              name: 'General Client',
              contact_name: 'Operations',
              contact_email: 'ops@ultrix.digital',
              timezone: 'America/New_York (EST)',
              active: true,
              created_by: actorId,
            },
          ])
          .select()
          .single();

        if (defClientErr) {
          return { success: false, error: `Failed to initialize client: ${defClientErr.message}` };
        }
        clientId = defaultClient.id;
      }
    }

    const seniority = ((formData.get('seniority') as string) || 'Mid') as SeniorityLevel;
    const headcountStr = formData.get('headcount') as string;
    const headcount = headcountStr ? Math.max(1, parseInt(headcountStr, 10)) : 1;
    const status = ((formData.get('status') as string) || 'Open') as OpeningStatus;
    const ownerId = (formData.get('owner_id') as string)?.trim() || actorId;

    const salaryMinStr = formData.get('salary_min') as string;
    const salaryMaxStr = formData.get('salary_max') as string;
    const billRateMinStr = formData.get('bill_rate_min') as string;
    const billRateMaxStr = formData.get('bill_rate_max') as string;

    const salaryMin = salaryMinStr ? parseFloat(salaryMinStr) : null;
    const salaryMax = salaryMaxStr ? parseFloat(salaryMaxStr) : null;
    const billRateMin = billRateMinStr ? parseFloat(billRateMinStr) : null;
    const billRateMax = billRateMaxStr ? parseFloat(billRateMaxStr) : null;

    // Parse tech stack
    const rawStack = formData.get('stack');
    let stack: string[] = [];
    if (typeof rawStack === 'string') {
      try {
        const parsed = JSON.parse(rawStack);
        stack = Array.isArray(parsed) ? parsed : [rawStack];
      } catch {
        stack = rawStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const nowIso = new Date().toISOString();
    const openingRecord: Partial<Opening> = {
      title,
      client_id: clientId as string,
      seniority,
      stack: stack.length > 0 ? stack : ['Generalist'],
      headcount,
      status,
      owner_id: ownerId || null,
      salary_min: salaryMin,
      salary_max: salaryMax,
      bill_rate_min: billRateMin,
      bill_rate_max: billRateMax,
      currency: 'USD',
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
    };

    const { data: newOpening, error: insertErr } = await supabase
      .from('openings')
      .insert([openingRecord])
      .select()
      .single();

    if (insertErr || !newOpening) {
      console.error('Insert opening error:', insertErr);
      return { success: false, error: insertErr?.message || 'Failed to insert opening record.' };
    }

    // Activity log
    await supabase.from('activity_log').insert([
      {
        entity_type: 'openings',
        entity_id: newOpening.id,
        actor_id: actorId,
        action: 'created',
        diff: { title, client_id: clientId, seniority, headcount },
        note: `Opening "${title}" created with status ${status}.`,
        created_at: nowIso,
      },
    ]);

    // Invalidate caches
    revalidatePath('/openings');
    revalidatePath(`/openings/${newOpening.id}`);
    revalidatePath('/recruiting');
    revalidatePath('/clients');
    revalidatePath('/people');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return {
      success: true,
      openingId: newOpening.id,
    };
  } catch (err: any) {
    console.error('createOpening error:', err);
    return { success: false, error: err.message || 'Internal server error creating opening.' };
  }
}

export async function updateOpening(
  openingId: string,
  updates: Partial<Opening>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();

    const { error } = await supabase
      .from('openings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', openingId);

    if (error) throw error;

    revalidatePath('/openings');
    revalidatePath(`/openings/${openingId}`);
    revalidatePath('/recruiting');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function moveCandidateStage(
  applicationId: string,
  stageId: string,
  options?: {
    rejectionReason?: RejectionReason | string;
    rejectionNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';

    // 1. Get current application, stage, and person
    const { data: appData, error: fetchErr } = await supabase
      .from('applications')
      .select('*, people(*), openings(*)')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !appData) {
      return { success: false, error: 'Application not found.' };
    }

    const { data: targetStage } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('id', stageId)
      .single();

    const nowIso = new Date().toISOString();
    const isHired = targetStage?.name === 'Hired';
    const isRejected = targetStage?.name === 'Rejected';

    const updatePayload: any = {
      stage_id: stageId,
      stage_changed_at: nowIso,
      updated_at: nowIso,
    };

    if (isRejected) {
      if (options?.rejectionReason) {
        updatePayload.rejection_reason = options.rejectionReason;
      }
      if (options?.rejectionNotes) {
        updatePayload.rejection_notes = options.rejectionNotes;
      }
    } else {
      updatePayload.rejection_reason = null;
      updatePayload.rejection_notes = null;
    }

    const { error: updateErr } = await supabase
      .from('applications')
      .update(updatePayload)
      .eq('id', applicationId);

    if (updateErr) throw updateErr;

    // 2. If Hired, transition person status to 'onboarding'
    if (isHired && appData.person_id) {
      await supabase
        .from('people')
        .update({ status: 'onboarding', updated_at: nowIso })
        .eq('id', appData.person_id);
    }

    // 3. Log activity
    await supabase.from('activity_log').insert([
      {
        entity_type: 'applications',
        entity_id: applicationId,
        person_id: appData.person_id,
        actor_id: actorId,
        action: 'stage_changed',
        diff: {
          previous_stage: appData.stage_id,
          new_stage: stageId,
          stage_name: targetStage?.name,
          rejection_reason: options?.rejectionReason || null,
        },
        note: `Candidate ${appData.people?.full_name || ''} moved to stage "${targetStage?.name || stageId}".`,
        created_at: nowIso,
      },
    ]);

    // 4. Invalidate caches
    revalidatePath('/openings');
    revalidatePath(`/openings/${appData.opening_id}`);
    revalidatePath('/recruiting');
    revalidatePath(`/recruiting/openings/${appData.opening_id}`);
    revalidatePath('/people');
    if (appData.person_id) {
      revalidatePath(`/people/${appData.person_id}`);
    }
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('moveCandidateStage error:', err);
    return { success: false, error: err.message };
  }
}

export async function addCandidateToOpening(
  personId: string,
  openingId: string,
  source = 'Internal Talent Pool'
): Promise<{ success: boolean; application?: any; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';

    // Check if application already exists
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('person_id', personId)
      .eq('opening_id', openingId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Candidate is already applied to this opening.' };
    }

    // Get initial Applied stage
    const { data: stages } = await supabase
      .from('pipeline_stages')
      .select('id')
      .order('stage_order', { ascending: true })
      .limit(1);

    const initialStageId = stages?.[0]?.id || '00000001-0000-0000-0000-000000000001';
    const nowIso = new Date().toISOString();

    const { data: newApp, error: insErr } = await supabase
      .from('applications')
      .insert([
        {
          person_id: personId,
          opening_id: openingId,
          stage_id: initialStageId,
          stage_changed_at: nowIso,
          source,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: actorId,
        },
      ])
      .select('*, people(*)')
      .single();

    if (insErr) throw insErr;

    // Activity log
    await supabase.from('activity_log').insert([
      {
        entity_type: 'applications',
        entity_id: openingId,
        person_id: personId,
        actor_id: actorId,
        action: 'added_to_opening',
        diff: { opening_id: openingId, stage_id: initialStageId },
        note: `Candidate added to opening pipeline.`,
        created_at: nowIso,
      },
    ]);

    revalidatePath('/openings');
    revalidatePath(`/openings/${openingId}`);
    revalidatePath('/people');
    revalidatePath(`/people/${personId}`);
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, application: newApp };
  } catch (err: any) {
    console.error('addCandidateToOpening error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteOpening(
  openingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';
    const actorRole = session?.role || 'admin';

    if (!['admin', 'hr_manager'].includes(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: Only Admin and HR Manager can delete job openings.',
      };
    }

    // 1. Fetch opening details for activity logging
    const { data: op } = await supabase
      .from('openings')
      .select('title, client_id')
      .eq('id', openingId)
      .maybeSingle();

    // 2. Perform deletion (foreign key ON DELETE CASCADE on applications will detach applications)
    const { error: delErr } = await supabase
      .from('openings')
      .delete()
      .eq('id', openingId);

    if (delErr) throw delErr;

    // 3. Record in activity log
    const nowIso = new Date().toISOString();
    await supabase.from('activity_log').insert([
      {
        entity_type: 'openings',
        entity_id: openingId,
        actor_id: actorId,
        action: 'deleted',
        diff: { title: op?.title },
        note: `Opening "${op?.title || openingId}" was permanently deleted.`,
        created_at: nowIso,
      },
    ]);

    // 4. Invalidate routes
    revalidatePath('/openings');
    revalidatePath('/recruiting');
    revalidatePath('/clients');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('deleteOpening error:', err);
    return { success: false, error: err.message || 'Failed to delete opening.' };
  }
}

export async function getAvailableTalentPoolCandidates(openingId: string) {
  const { getAvailableTalentPoolCandidates: getFromCandidates } = await import('@/actions/candidates');
  return getFromCandidates(openingId);
}
