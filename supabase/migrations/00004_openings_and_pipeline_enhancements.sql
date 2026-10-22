-- ============================================================================
-- 00004_openings_and_pipeline_enhancements.sql
-- Ultrix Talent Hub: Openings & Candidate Pipeline Enhancements
-- ============================================================================

-- 1. Ensure openings.client_id allows NULL if an opening is created before client assignment
ALTER TABLE IF EXISTS public.openings ALTER COLUMN client_id DROP NOT NULL;

-- 2. Ensure openings foreign keys
ALTER TABLE IF EXISTS public.openings 
  DROP CONSTRAINT IF EXISTS openings_client_id_fkey,
  ADD CONSTRAINT openings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.openings 
  DROP CONSTRAINT IF EXISTS openings_owner_id_fkey,
  ADD CONSTRAINT openings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Ensure pipeline_stages has all 7 stages
INSERT INTO public.pipeline_stages (id, name, stage_order, is_terminal) VALUES
    ('00000001-0000-0000-0000-000000000001', 'Applied', 1, false),
    ('00000001-0000-0000-0000-000000000002', 'Screening', 2, false),
    ('00000001-0000-0000-0000-000000000003', 'Technical interview', 3, false),
    ('00000001-0000-0000-0000-000000000004', 'Client interview', 4, false),
    ('00000001-0000-0000-0000-000000000005', 'Offer', 5, false),
    ('00000001-0000-0000-0000-000000000006', 'Hired', 6, true),
    ('00000001-0000-0000-0000-000000000007', 'Rejected', 7, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    stage_order = EXCLUDED.stage_order,
    is_terminal = EXCLUDED.is_terminal;

-- 4. Ensure applications unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_person_opening'
    ) THEN
        ALTER TABLE public.applications ADD CONSTRAINT unique_person_opening UNIQUE (person_id, opening_id);
    END IF;
END $$;

-- 5. RLS policies for openings and applications to allow read/write
ALTER TABLE public.openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access to openings" ON public.openings;
CREATE POLICY "Allow authenticated full access to openings" ON public.openings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to openings" ON public.openings;
CREATE POLICY "Allow anon full access to openings" ON public.openings
    FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access to applications" ON public.applications;
CREATE POLICY "Allow authenticated full access to applications" ON public.applications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon full access to applications" ON public.applications;
CREATE POLICY "Allow anon full access to applications" ON public.applications
    FOR ALL TO anon USING (true) WITH CHECK (true);
