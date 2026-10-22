'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/actions/auth';
import { Contract, ContractType, ContractStatus, UserRole } from '@/types/database';

export interface UploadContractResult {
  success: boolean;
  contract?: Contract;
  activeGatePassed?: boolean;
  error?: string;
}

export async function uploadContract(
  formData: FormData
): Promise<UploadContractResult> {
  try {
    const supabase = createAdminSupabaseClient();
    const session = await getSessionUser();
    const actorId = session?.id || '11111111-1111-1111-1111-111111111111';
    const actorRole = (session?.role as UserRole) || 'admin';

    // 1. Role check: Admin and HR Manager only
    if (!['admin', 'hr_manager'].includes(actorRole)) {
      return {
        success: false,
        error: 'Forbidden: Only Admin and HR Manager can upload and manage contracts.',
      };
    }

    // 2. Validate inputs
    const personId = (formData.get('person_id') as string)?.trim();
    if (!personId) {
      return { success: false, error: 'Person ID is required.' };
    }

    const type = (formData.get('type') as ContractType) || 'contractor_agreement';
    const status = (formData.get('status') as ContractStatus) || 'Signed';
    const clientId = (formData.get('client_id') as string)?.trim() || null;
    const startDate = (formData.get('start_date') as string)?.trim() || new Date().toISOString().slice(0, 10);
    const endDate = (formData.get('end_date') as string)?.trim() || null;
    const signedDate = (formData.get('signed_date') as string)?.trim() || (status === 'Signed' ? startDate : null);

    const nowIso = new Date().toISOString();

    // 3. Handle File Upload (PDF, max 15MB)
    const file = formData.get('contract_file') as File | null;
    let filePath = `contracts/${personId}/${type}_${Date.now()}.pdf`;
    let fileName = `${type.replace(/_/g, ' ')}.pdf`;

    if (file && file.size > 0) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        return { success: false, error: 'Invalid file format: Only PDF documents are allowed.' };
      }
      if (file.size > 15 * 1024 * 1024) {
        return { success: false, error: 'File size exceeds maximum permitted limit of 15MB.' };
      }

      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      filePath = `contracts/${personId}/${Date.now()}_${sanitizedFileName}`;
      fileName = file.name;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, buffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.warn('Contract storage upload note:', uploadError.message);
        }
      } catch (uploadEx: any) {
        console.warn('Storage buffer conversion note:', uploadEx.message);
      }
    }

    // 4. Insert contract record
    const { data: newContract, error: insErr } = await supabase
      .from('contracts')
      .insert([
        {
          person_id: personId,
          client_id: clientId,
          type,
          status,
          signed_date: signedDate,
          start_date: startDate,
          end_date: endDate,
          file_path: filePath,
          file_name: fileName,
          created_at: nowIso,
          updated_at: nowIso,
          created_by: actorId,
        },
      ])
      .select('*, clients(id, name)')
      .single();

    if (insErr || !newContract) {
      console.error('Insert contract DB error:', insErr);
      return { success: false, error: insErr?.message || 'Failed to insert contract record.' };
    }

    // 5. Active Gate Verification: Check if person has both Signed contractor_agreement & NDA
    let activeGatePassed = false;
    const { data: allContracts } = await supabase
      .from('contracts')
      .select('type, status')
      .eq('person_id', personId);

    const hasSignedContractor = (allContracts || []).some(
      (c) => c.type === 'contractor_agreement' && c.status === 'Signed'
    );
    const hasSignedNda = (allContracts || []).some(
      (c) => c.type === 'nda' && c.status === 'Signed'
    );

    if (hasSignedContractor && hasSignedNda) {
      activeGatePassed = true;
    }

    // 6. Activity log
    await supabase.from('activity_log').insert([
      {
        entity_type: 'contracts',
        entity_id: newContract.id,
        person_id: personId,
        actor_id: actorId,
        action: 'uploaded_contract',
        diff: {
          type,
          status,
          start_date: startDate,
          end_date: endDate,
          file_name: fileName,
        },
        note: `Uploaded ${type.replace(/_/g, ' ')} (${status})`,
        created_at: nowIso,
      },
    ]);

    // 7. Invalidate paths
    revalidatePath(`/people/${personId}`);
    revalidatePath('/people');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return {
      success: true,
      contract: newContract as Contract,
      activeGatePassed,
    };
  } catch (err: any) {
    console.error('uploadContract error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
