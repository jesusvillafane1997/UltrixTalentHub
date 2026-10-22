'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import {
  Person,
  Application,
  Document,
  ActivityLog,
  EnglishLevel,
  SeniorityLevel,
  UserRole,
} from '@/types/database';
import { Permissions } from '@/lib/auth';
import { getSessionUser } from '@/actions/auth';

export interface CreateCandidateResult {
  success: boolean;
  personId?: string;
  error?: string;
  candidate?: Person;
  application?: Application;
  document?: Document;
}

export async function createCandidate(formData: FormData): Promise<CreateCandidateResult> {
  try {
    const supabase = createAdminSupabaseClient();

    // 1. Authenticate & Authorize
    const session = await getSessionUser();
    const actorId =
      (formData.get('actor_id') as string) ||
      session?.id ||
      '11111111-1111-1111-1111-111111111111';
    const actorRole =
      (formData.get('actor_role') as UserRole) ||
      session?.role ||
      'admin';

    if (!Permissions.canAddCandidate(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: Only Admin, HR Manager, and Recruiter can add candidates.',
      };
    }

    // 2. Validate input fields
    const fullName = (formData.get('full_name') as string)?.trim();
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Full name is required (min 2 characters).' };
    }

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: 'A valid email address is required.' };
    }

    const country = (formData.get('country') as string)?.trim();
    if (!country) {
      return { success: false, error: 'Country is required.' };
    }

    const timezone = (formData.get('timezone') as string)?.trim();
    if (!timezone) {
      return { success: false, error: 'Timezone is required.' };
    }

    const englishLevel = (formData.get('english_level') as EnglishLevel) || 'B2';
    const seniority = (formData.get('seniority') as SeniorityLevel) || 'Mid';

    // Parse skills
    const rawSkills = formData.get('skills');
    let skills: string[] = [];
    if (typeof rawSkills === 'string') {
      try {
        const parsed = JSON.parse(rawSkills);
        skills = Array.isArray(parsed) ? parsed : [rawSkills];
      } catch {
        skills = rawSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const phone = (formData.get('phone') as string)?.trim() || null;
    const linkedinUrl = (formData.get('linkedin_url') as string)?.trim() || null;
    const salaryExpStr = formData.get('salary_expectation') as string;
    const salaryExpectation = salaryExpStr ? parseFloat(salaryExpStr) : null;
    const availabilityDate = (formData.get('availability_date') as string)?.trim() || null;
    const openingId = (formData.get('opening_id') as string)?.trim() || null;
    const source = (formData.get('source') as string)?.trim() || 'Direct Candidate';

    // 3. Generate candidate ID & Record
    const personId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const candidateRecord: Person = {
      id: personId,
      full_name: fullName,
      email,
      phone,
      country,
      timezone,
      status: 'candidate',
      english_level: englishLevel,
      seniority,
      skills: skills.length > 0 ? skills : ['Generalist'],
      linkedin_url: linkedinUrl,
      photo_url: null,
      salary_expectation: salaryExpectation,
      salary_currency: 'USD',
      availability_date: availabilityDate,
      do_not_rehire: false,
      created_at: nowIso,
      updated_at: nowIso,
      created_by: actorId,
    };

    // 4. Handle CV File Upload (if attached)
    let documentRecord: Document | undefined = undefined;
    const cvFile = formData.get('cv_file') as File | null;

    if (cvFile && cvFile.size > 0) {
      if (cvFile.type !== 'application/pdf' && !cvFile.name.toLowerCase().endsWith('.pdf')) {
        return { success: false, error: 'Only PDF format is accepted for CV upload.' };
      }
      if (cvFile.size > 10 * 1024 * 1024) {
        return { success: false, error: 'CV file exceeds maximum permitted size of 10MB.' };
      }

      const sanitizedFileName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `cvs/${personId}/${Date.now()}_${sanitizedFileName}`;

      try {
        const arrayBuffer = await cvFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage 'documents' bucket
        const { error: storageError } = await supabase.storage
          .from('documents')
          .upload(storagePath, buffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (storageError) {
          console.warn('Supabase storage upload note:', storageError.message);
        }
      } catch (err: any) {
        console.warn('Storage buffer processing fallback:', err.message);
      }

      documentRecord = {
        id: crypto.randomUUID(),
        person_id: personId,
        type: 'cv',
        file_path: storagePath,
        file_name: cvFile.name,
        file_size: cvFile.size,
        mime_type: 'application/pdf',
        created_at: nowIso,
        created_by: actorId,
      };
    }

    // 5. Handle Opening Pipeline Application (if opening_id is passed)
    let applicationRecord: Application | undefined = undefined;

    // 6. Activity Log entry
    const activityLogRecord: ActivityLog = {
      id: crypto.randomUUID(),
      entity_type: 'people',
      entity_id: personId,
      person_id: personId,
      actor_id: actorId,
      action: 'created',
      diff: {
        status: 'candidate',
        opening_id: openingId,
        cv_uploaded: Boolean(documentRecord),
      },
      note: openingId
        ? 'Candidate created and added to opening pipeline'
        : 'Candidate created in talent pool directory',
      created_at: nowIso,
    };

    // 7. Persist to Supabase Database
    const { data: insertedPerson, error: insertErr } = await supabase
      .from('people')
      .insert([candidateRecord])
      .select()
      .single();

    if (insertErr || !insertedPerson) {
      console.error('Supabase DB insert error:', insertErr);
      return {
        success: false,
        error: `Database error inserting candidate: ${insertErr?.message || 'Failed to insert person.'}`,
      };
    }

    // Insert application linking candidate to opening if openingId was supplied
    if (openingId) {
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id, stage_order')
        .order('stage_order', { ascending: true })
        .limit(1);

      const initialStageId =
        stages?.[0]?.id || '00000001-0000-0000-0000-000000000001';

      const appToInsert = {
        id: crypto.randomUUID(),
        person_id: personId,
        opening_id: openingId,
        stage_id: initialStageId,
        stage_changed_at: nowIso,
        source: source || 'Manual Sourcing',
        created_at: nowIso,
        updated_at: nowIso,
        created_by: actorId,
      };

      const { data: insertedApp, error: appErr } = await supabase
        .from('applications')
        .insert([appToInsert])
        .select()
        .single();

      if (appErr) {
        console.error('Supabase DB application insert error:', appErr);
      } else {
        applicationRecord = (insertedApp as Application) || appToInsert;
      }
    }

    if (documentRecord) {
      const { error: docErr } = await supabase
        .from('documents')
        .insert([documentRecord]);
      if (docErr) console.warn('Supabase DB document insert note:', docErr.message);
    }

    const { error: logErr } = await supabase
      .from('activity_log')
      .insert([activityLogRecord]);
    if (logErr) console.warn('Supabase DB activity log insert note:', logErr.message);

    // 8. Revalidate cache across all dashboard and talent directory routes
    revalidatePath('/openings');
    if (openingId) {
      revalidatePath(`/openings/${openingId}`);
    }
    revalidatePath('/openings/[id]', 'page');
    revalidatePath('/people');
    revalidatePath(`/people/${personId}`);
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/recruiting');
    revalidatePath('/recruiting/candidates');
    revalidatePath('/recruiting/openings/[id]', 'page');

    return {
      success: true,
      personId,
      candidate: (insertedPerson as Person) || candidateRecord,
      application: applicationRecord,
      document: documentRecord,
    };
  } catch (err: any) {
    console.error('Failed to create candidate:', err);
    return { success: false, error: err.message || 'Internal server error creating candidate.' };
  }
}

export async function getAvailableTalentPoolCandidates(openingId: string): Promise<Person[]> {
  try {
    const supabase = createAdminSupabaseClient();

    // 1. Get IDs of people who already have an application for this specific opening
    const { data: existingApps, error: appsError } = await supabase
      .from('applications')
      .select('person_id')
      .eq('opening_id', openingId);

    if (appsError) {
      console.error('Error fetching existing applications:', appsError);
    }

    const existingPersonIds = new Set(
      (existingApps || []).map((app: any) => app.person_id).filter(Boolean)
    );

    // 2. Fetch candidates from `people`
    // Accept candidate status, bench, and unassigned workforce, excluding do_not_rehire and archived
    const query = supabase
      .from('people')
      .select('id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, photo_url, salary_expectation, salary_currency, availability_date, do_not_rehire, archived_at, created_at')
      .eq('do_not_rehire', false)
      .is('archived_at', null)
      .order('full_name', { ascending: true });

    const { data: candidates, error: peopleError } = await query;

    if (peopleError) {
      console.error('Error fetching talent pool candidates:', peopleError);
      return [];
    }

    // Exclude people already in this opening pipeline and any with 'archived' status
    const available = (candidates || []).filter((p: any) => {
      if (existingPersonIds.has(p.id)) return false;
      if (p.status === 'archived') return false;
      return true;
    });

    return available as Person[];
  } catch (err: any) {
    console.error('getAvailableTalentPoolCandidates error:', err);
    return [];
  }
}

export async function deleteCandidate(
  personId: string,
  force: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';
    const actorRole = session?.role || 'admin';

    if (!['admin', 'hr_manager'].includes(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: Only Admin and HR Manager can permanently delete candidate records.',
      };
    }

    // 1. Fetch person record to inspect status and name
    const { data: person, error: fetchErr } = await supabase
      .from('people')
      .select('id, full_name, status')
      .eq('id', personId)
      .maybeSingle();

    if (fetchErr || !person) {
      return { success: false, error: 'Candidate record not found.' };
    }

    // 2. Safeguard: Check if person has assignments (i.e. is/was a placed worker)
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('person_id', personId)
      .limit(1);

    const hasAssignments = assignments && assignments.length > 0;
    const isActiveWorker = person.status === 'active';

    if ((isActiveWorker || hasAssignments) && !force) {
      return {
        success: false,
        error:
          'Active workers with client assignments or financial records require confirmation to permanently delete. Check the confirmation box to force purge.',
      };
    }

    // 3. Storage file cleanup: list and remove any files in documents bucket under cvs/[personId] and contracts/[personId]
    try {
      const { data: cvFiles } = await supabase.storage
        .from('documents')
        .list(`cvs/${personId}`);

      if (cvFiles && cvFiles.length > 0) {
        const filePaths = cvFiles.map((f) => `cvs/${personId}/${f.name}`);
        await supabase.storage.from('documents').remove(filePaths);
      }

      const { data: contractFiles } = await supabase.storage
        .from('documents')
        .list(`contracts/${personId}`);

      if (contractFiles && contractFiles.length > 0) {
        const filePaths = contractFiles.map((f) => `contracts/${personId}/${f.name}`);
        await supabase.storage.from('documents').remove(filePaths);
      }
    } catch (storageErr: any) {
      console.warn('Storage cleanup non-blocking note:', storageErr?.message);
    }

    // 4. Delete the person row (cascades to assignments, contracts, comp records, applications, documents, scorecards, reviews)
    const { error: delErr } = await supabase
      .from('people')
      .delete()
      .eq('id', personId);

    if (delErr) throw delErr;

    // 5. Activity log entry
    const nowIso = new Date().toISOString();
    await supabase.from('activity_log').insert([
      {
        entity_type: 'people',
        entity_id: personId,
        actor_id: actorId,
        action: 'deleted',
        diff: { full_name: person.full_name, previous_status: person.status, forced: force },
        note: `Candidate ${person.full_name} was permanently purged${force ? ' (force override)' : ''}.`,
        created_at: nowIso,
      },
    ]);

    // 6. Invalidate caches
    revalidatePath('/people');
    revalidatePath('/recruiting/candidates');
    revalidatePath('/recruiting');
    revalidatePath('/openings');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true };
  } catch (err: any) {
    console.error('deleteCandidate error:', err);
    return { success: false, error: err.message || 'Failed to delete candidate.' };
  }
}
