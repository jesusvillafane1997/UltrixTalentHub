import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Generates a short-lived signed URL expiring in 60 seconds for private documents/CVs
export async function POST(request: Request) {
  try {
    const { documentId, filePath, personId, requestedBy } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath parameter' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Generate real Supabase Storage signed URL from 'documents' private bucket
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60);

    if (error || !data?.signedUrl) {
      console.warn('Supabase signed URL error:', error?.message);
      return NextResponse.json(
        { error: error?.message || 'Could not generate signed download URL for document' },
        { status: 404 }
      );
    }

    // Optional activity audit log
    try {
      if (documentId && requestedBy) {
        await supabase.from('activity_log').insert([
          {
            id: crypto.randomUUID(),
            action: 'view_document_signed_url',
            entity_type: 'documents',
            entity_id: documentId,
            person_id: personId || null,
            actor_id: requestedBy,
            diff: { file_path: filePath, expires_in: 60 },
            note: 'Generated 60s signed download URL for document',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // Non-blocking audit log
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      expiresInSeconds: 60,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
