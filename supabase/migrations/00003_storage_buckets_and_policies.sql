-- Migration 00003: Storage Buckets & Policies for Documents & CVs
-- Author: David / Antigravity AI Engineering
-- Date: 2026-10-19

-- 1. Create the private 'documents' bucket in Supabase storage if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf']::text[];

-- 2. Storage RLS Policies for 'documents' bucket
-- Allow Admin, HR Manager, and Recruiter to upload files to documents bucket
DROP POLICY IF EXISTS "Documents storage insert policy" ON storage.objects;
CREATE POLICY "Documents storage insert policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (
        current_user_role() IN ('admin', 'hr_manager', 'recruiter')
        OR auth.role() = 'service_role'
        OR current_user_role() IS NULL -- Fallback for service context
    )
);

-- Allow authorized roles to read / download documents from storage
DROP POLICY IF EXISTS "Documents storage select policy" ON storage.objects;
CREATE POLICY "Documents storage select policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents'
    AND (
        current_user_role() IN ('admin', 'hr_manager', 'recruiter', 'viewer', 'account_manager')
        OR auth.role() = 'service_role'
        OR current_user_role() IS NULL
    )
);

-- Allow Admin, HR Manager, and Recruiter to update or replace documents
DROP POLICY IF EXISTS "Documents storage update policy" ON storage.objects;
CREATE POLICY "Documents storage update policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documents'
    AND (
        current_user_role() IN ('admin', 'hr_manager', 'recruiter')
        OR auth.role() = 'service_role'
    )
);

-- Allow Admin and HR Manager to delete documents
DROP POLICY IF EXISTS "Documents storage delete policy" ON storage.objects;
CREATE POLICY "Documents storage delete policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents'
    AND (
        current_user_role() IN ('admin', 'hr_manager')
        OR auth.role() = 'service_role'
    )
);

-- 3. Confirm RLS on Database Tables
-- Ensure INSERT on people, applications, documents, activity_log are accessible to admin, hr_manager, recruiter

-- Verify people insert policy
DROP POLICY IF EXISTS "People insert policy" ON people;
CREATE POLICY "People insert policy" ON people
FOR INSERT WITH CHECK (
    current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
);

-- Verify applications insert policy
DROP POLICY IF EXISTS "Applications insert policy" ON applications;
CREATE POLICY "Applications insert policy" ON applications
FOR INSERT WITH CHECK (
    current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
);

-- Verify documents insert policy
DROP POLICY IF EXISTS "Documents insert policy" ON documents;
CREATE POLICY "Documents insert policy" ON documents
FOR INSERT WITH CHECK (
    current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
);

-- Verify activity_log insert policy
DROP POLICY IF EXISTS "Activity log insert policy" ON activity_log;
CREATE POLICY "Activity log insert policy" ON activity_log
FOR INSERT WITH CHECK (
    true
);
