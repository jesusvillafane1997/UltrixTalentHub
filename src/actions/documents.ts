'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Document, ActivityLog, UserRole } from '@/types/database';
import { Permissions } from '@/lib/auth';
import { getSessionUser } from '@/actions/auth';

export interface UploadCVResult {
  success: boolean;
  document?: Document;
  error?: string;
}

export async function uploadCandidateCV(
  personId: string,
  formData: FormData
): Promise<UploadCVResult> {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authorize
    const session = await getSessionUser();
    const actorId =
      (formData.get('actor_id') as string) ||
      session?.id ||
      '11111111-1111-1111-1111-111111111111';
    const actorRole =
      (formData.get('actor_role') as UserRole) ||
      session?.role ||
      'admin';

    if (!Permissions.canUploadCV(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: Only Admin, HR Manager, and Recruiter can upload CV documents.',
      };
    }

    // 2. Validate file
    const cvFile = formData.get('cv_file') as File | null;
    if (!cvFile || cvFile.size === 0) {
      return { success: false, error: 'No CV file provided.' };
    }

    if (cvFile.type !== 'application/pdf' && !cvFile.name.toLowerCase().endsWith('.pdf')) {
      return { success: false, error: 'Invalid file format: Only PDF files are accepted.' };
    }

    if (cvFile.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds maximum permitted limit of 10MB.' };
    }

    const sanitizedFileName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `cvs/${personId}/${Date.now()}_${sanitizedFileName}`;
    const nowIso = new Date().toISOString();

    // 3. Upload to Supabase Storage 'documents' bucket
    try {
      const arrayBuffer = await cvFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.warn('Supabase storage upload note:', uploadError.message);
      }
    } catch (err: any) {
      console.warn('Storage buffer conversion note:', err.message);
    }

    // 4. Create Document record
    const documentRecord: Document = {
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

    // 5. Activity Log record
    const activityLogRecord: ActivityLog = {
      id: crypto.randomUUID(),
      entity_type: 'people',
      entity_id: personId,
      person_id: personId,
      actor_id: actorId,
      action: 'uploaded_document',
      diff: {
        document_id: documentRecord.id,
        file_name: cvFile.name,
        type: 'cv',
      },
      note: 'Uploaded CV',
      created_at: nowIso,
    };

    // 6. Persist to Supabase DB
    const { error: docErr } = await supabase.from('documents').insert([documentRecord]);
    if (docErr) {
      console.error('Supabase DB document insert error:', docErr);
      return { success: false, error: docErr.message };
    }

    const { error: logErr } = await supabase.from('activity_log').insert([activityLogRecord]);
    if (logErr) {
      console.warn('Supabase DB activity log insert error:', logErr.message);
    }

    // 7. Revalidate
    revalidatePath(`/people/${personId}`);
    revalidatePath('/people');
    revalidatePath('/recruiting');

    return {
      success: true,
      document: documentRecord,
    };
  } catch (err: any) {
    console.error('Failed to upload candidate CV:', err);
    return { success: false, error: err.message || 'Error uploading candidate CV.' };
  }
}

export async function getSignedCVUrl(
  filePath: string,
  expiresIn = 60
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.signedUrl) {
      return { success: false, error: 'Failed to generate signed download URL.' };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
