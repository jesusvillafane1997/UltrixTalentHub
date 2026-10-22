-- ============================================================================
-- ULTRIX TALENT HUB - COMPLETE ALL-IN-ONE DATABASE SETUP SCRIPT
-- ============================================================================
-- This script contains the entire database setup:
-- 1. PostgreSQL Extensions
-- 2. Custom Enum Types
-- 3. Core Relational Tables
-- 4. Triggers (Active Gate & Updated At)
-- 5. Analytical & Master Workforce Views
-- 6. Helper Security Functions
-- 7. Row-Level Security (RLS) Policies
-- 8. Storage Buckets ('documents') and Storage Policies
-- 9. Complete Seed Data
--
-- INSTRUCTIONS FOR SUPABASE SQL EDITOR:
-- 1. In Supabase Dashboard, navigate to: SQL Editor -> New Query.
-- 2. Paste this entire file into the editor.
-- 3. IMPORTANT: Make sure NO TEXT IS HIGHLIGHTED/SELECTED in the editor.
--    (If text is highlighted, Supabase will only execute the highlighted lines!)
-- 4. Click the green "Run" button (or press Ctrl+Enter / Cmd+Enter).
-- ============================================================================

SET search_path = public, extensions;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'hr_manager', 'recruiter', 'account_manager', 'viewer', 'unassigned');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'person_status') THEN
        CREATE TYPE public.person_status AS ENUM ('candidate', 'onboarding', 'active', 'bench', 'offboarded', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'english_level_type') THEN
        CREATE TYPE public.english_level_type AS ENUM ('B1', 'B2', 'C1', 'C2', 'Native');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seniority_level') THEN
        CREATE TYPE public.seniority_level AS ENUM ('Junior', 'Mid', 'Senior', 'Lead', 'Principal');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opening_status') THEN
        CREATE TYPE public.opening_status AS ENUM ('Open', 'On hold', 'Filled', 'Cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rejection_reason_type') THEN
        CREATE TYPE public.rejection_reason_type AS ENUM ('skills', 'english', 'salary_expectations', 'client_declined', 'withdrew', 'other');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interview_type') THEN
        CREATE TYPE public.interview_type AS ENUM ('Screening', 'Technical interview', 'Client interview', 'Offer', 'Final');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recommendation_type') THEN
        CREATE TYPE public.recommendation_type AS ENUM ('Strong yes', 'Yes', 'No', 'Strong no');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE public.assignment_status AS ENUM ('Active', 'Ended');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rate_frequency') THEN
        CREATE TYPE public.rate_frequency AS ENUM ('hourly', 'monthly');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engagement_type_enum') THEN
        CREATE TYPE public.engagement_type_enum AS ENUM ('contractor', 'employee');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comp_reason') THEN
        CREATE TYPE public.comp_reason AS ENUM ('hire', 'raise', 'adjustment', 'promotion');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
        CREATE TYPE public.contract_type AS ENUM ('contractor_agreement', 'nda', 'client_sow', 'amendment', 'termination');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
        CREATE TYPE public.contract_status AS ENUM ('Draft', 'Sent', 'Signed', 'Expired', 'Terminated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE public.document_type AS ENUM ('cv', 'id_copy', 'certificate', 'other');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE public.review_status AS ENUM ('Pending', 'Submitted', 'Acknowledged by HR');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'health_status') THEN
        CREATE TYPE public.health_status AS ENUM ('Green', 'Yellow', 'Red');
    END IF;
END $$;

-- ============================================================================
-- 3. CORE RELATIONAL TABLES
-- ============================================================================

-- Table 1: users (Ultrix Staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL CHECK (email ILIKE '%@ultrix.digital'),
    name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'unassigned',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: people (Candidates & Workers)
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    country TEXT NOT NULL,
    timezone TEXT NOT NULL,
    status public.person_status NOT NULL DEFAULT 'candidate',
    english_level public.english_level_type NOT NULL DEFAULT 'B2',
    seniority public.seniority_level NOT NULL DEFAULT 'Mid',
    skills TEXT[] NOT NULL DEFAULT '{}',
    linkedin_url TEXT,
    photo_url TEXT,
    salary_expectation NUMERIC(12, 2),
    salary_currency TEXT NOT NULL DEFAULT 'USD',
    availability_date DATE,
    do_not_rehire BOOLEAN NOT NULL DEFAULT false,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 3: clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    timezone TEXT NOT NULL,
    account_manager_id UUID REFERENCES users(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 4: openings
CREATE TABLE IF NOT EXISTS openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    seniority public.seniority_level NOT NULL DEFAULT 'Mid',
    stack TEXT[] NOT NULL DEFAULT '{}',
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    bill_rate_min NUMERIC(12, 2),
    bill_rate_max NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    headcount INT NOT NULL DEFAULT 1 CHECK (headcount >= 1),
    status public.opening_status NOT NULL DEFAULT 'Open',
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 5: pipeline_stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stage_order INT NOT NULL,
    is_terminal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 6: applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    opening_id UUID NOT NULL REFERENCES openings(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    stage_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rejection_reason public.rejection_reason_type,
    rejection_notes TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    CONSTRAINT unique_person_opening UNIQUE (person_id, opening_id)
);

-- Table 7: interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type public.interview_type NOT NULL DEFAULT 'Screening',
    scheduled_at TIMESTAMPTZ NOT NULL,
    interviewer_ids UUID[] NOT NULL DEFAULT '{}',
    meeting_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 8: scorecards
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id),
    technical INT NOT NULL CHECK (technical BETWEEN 1 AND 4),
    english INT NOT NULL CHECK (english BETWEEN 1 AND 4),
    communication INT NOT NULL CHECK (communication BETWEEN 1 AND 4),
    culture_fit INT NOT NULL CHECK (culture_fit BETWEEN 1 AND 4),
    recommendation public.recommendation_type NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_interview_reviewer UNIQUE (interview_id, interviewer_id)
);

-- Table 9: assignments (Worker to Client contract link)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    role_title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 40,
    bill_rate NUMERIC(12, 2) NOT NULL,
    bill_rate_unit public.rate_frequency NOT NULL DEFAULT 'monthly',
    currency TEXT NOT NULL DEFAULT 'USD',
    account_manager_id UUID REFERENCES users(id),
    status public.assignment_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 10: compensation_records (Append-only salary ledger)
CREATE TABLE IF NOT EXISTS compensation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    frequency public.rate_frequency NOT NULL DEFAULT 'monthly',
    engagement_type public.engagement_type_enum NOT NULL DEFAULT 'contractor',
    effective_date DATE NOT NULL,
    reason public.comp_reason NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 11: contracts
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    type public.contract_type NOT NULL,
    status public.contract_status NOT NULL DEFAULT 'Draft',
    signed_date DATE,
    start_date DATE NOT NULL,
    end_date DATE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 12: documents (CVs, Certs, ID copies)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type public.document_type NOT NULL DEFAULT 'cv',
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INT,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Table 13: reviews (Monthly worker performance review)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    due_date DATE NOT NULL,
    status public.review_status NOT NULL DEFAULT 'Pending',
    rating_delivery INT CHECK (rating_delivery BETWEEN 1 AND 5),
    rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),
    rating_reliability INT CHECK (rating_reliability BETWEEN 1 AND 5),
    rating_proactivity INT CHECK (rating_proactivity BETWEEN 1 AND 5),
    rating_client_satisfaction INT CHECK (rating_client_satisfaction BETWEEN 1 AND 5),
    average_score NUMERIC(3, 2),
    client_feedback TEXT,
    feedback_source TEXT,
    wins TEXT,
    concerns TEXT,
    attendance_issues TEXT,
    health public.health_status,
    submitted_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_person_period UNIQUE (person_id, period)
);

-- Table 14: action_items (Action items tied to reviews)
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    due_date DATE NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 15: activity_log (Audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    diff JSONB NOT NULL DEFAULT '{}'::jsonb,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Active Gate: A worker cannot transition to 'active' without both a Signed contractor agreement and a Signed NDA
CREATE OR REPLACE FUNCTION check_active_gate_trigger()
RETURNS TRIGGER AS $$
DECLARE
    has_signed_contractor BOOLEAN;
    has_signed_nda BOOLEAN;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status != 'active' THEN
        SELECT EXISTS (
            SELECT 1 FROM contracts
            WHERE person_id = NEW.id
              AND type = 'contractor_agreement'
              AND status = 'Signed'
        ) INTO has_signed_contractor;

        SELECT EXISTS (
            SELECT 1 FROM contracts
            WHERE person_id = NEW.id
              AND type = 'nda'
              AND status = 'Signed'
        ) INTO has_signed_nda;

        IF NOT has_signed_contractor OR NOT has_signed_nda THEN
            RAISE EXCEPTION 'Active Gate violation: Worker % cannot be marked Active without both a Signed contractor agreement and a Signed NDA on file.', NEW.full_name;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_people_active_gate ON people;
CREATE TRIGGER trg_people_active_gate
BEFORE UPDATE OF status ON people
FOR EACH ROW
EXECUTE FUNCTION check_active_gate_trigger();

-- Updated At Auto-timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_people_updated_at ON people;
CREATE TRIGGER trg_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_clients_updated_at ON clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_openings_updated_at ON openings;
CREATE TRIGGER trg_openings_updated_at BEFORE UPDATE ON openings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_interviews_updated_at ON interviews;
CREATE TRIGGER trg_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_scorecards_updated_at ON scorecards;
CREATE TRIGGER trg_scorecards_updated_at BEFORE UPDATE ON scorecards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON assignments;
CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_action_items_updated_at ON action_items;
CREATE TRIGGER trg_action_items_updated_at BEFORE UPDATE ON action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. DERIVED VIEWS (Analytics, Margins, Bench & Workforce)
-- ============================================================================

CREATE OR REPLACE VIEW view_person_latest_salary AS
SELECT DISTINCT ON (person_id)
    person_id,
    amount AS current_salary,
    currency AS salary_currency,
    frequency AS salary_frequency,
    effective_date AS salary_effective_date,
    engagement_type
FROM compensation_records
ORDER BY person_id, effective_date DESC, created_at DESC;

CREATE OR REPLACE VIEW view_person_active_assignment AS
SELECT DISTINCT ON (person_id)
    a.id AS assignment_id,
    a.person_id,
    a.client_id,
    c.name AS client_name,
    a.role_title,
    a.start_date,
    a.end_date,
    a.bill_rate,
    a.bill_rate_unit,
    a.currency AS bill_rate_currency,
    a.account_manager_id,
    u.name AS account_manager_name,
    a.status AS assignment_status
FROM assignments a
JOIN clients c ON c.id = a.client_id
LEFT JOIN users u ON u.id = a.account_manager_id
WHERE a.status = 'Active'
ORDER BY person_id, a.start_date DESC;

CREATE OR REPLACE VIEW view_person_latest_review AS
SELECT DISTINCT ON (person_id)
    id AS review_id,
    person_id,
    period,
    health AS latest_health,
    average_score AS latest_score,
    status AS review_status,
    due_date,
    submitted_at
FROM reviews
ORDER BY person_id, period DESC;

CREATE OR REPLACE VIEW view_person_next_contract_expiry AS
SELECT DISTINCT ON (person_id)
    person_id,
    id AS contract_id,
    type AS contract_type,
    end_date AS next_expiry_date,
    (end_date - CURRENT_DATE) AS days_until_expiry
FROM contracts
WHERE status = 'Signed' AND end_date >= CURRENT_DATE
ORDER BY person_id, end_date ASC;

CREATE OR REPLACE VIEW view_workforce_master AS
SELECT
    p.id,
    p.full_name,
    p.email,
    p.country,
    p.timezone,
    p.status,
    p.seniority,
    p.skills,
    p.english_level,
    p.photo_url,
    p.availability_date,
    p.created_at,
    
    -- Current Assignment
    va.assignment_id,
    va.client_id,
    va.client_name,
    va.role_title,
    va.start_date AS assignment_start_date,
    va.account_manager_id,
    va.account_manager_name,
    va.bill_rate,
    va.bill_rate_unit,
    
    -- Latest Comp
    vs.current_salary,
    vs.salary_currency,
    vs.salary_frequency,
    
    -- Margin: bill_rate - salary (normalized to monthly)
    CASE
        WHEN va.bill_rate IS NOT NULL AND vs.current_salary IS NOT NULL THEN
            (CASE WHEN va.bill_rate_unit = 'hourly' THEN va.bill_rate * 160 ELSE va.bill_rate END) -
            (CASE WHEN vs.salary_frequency = 'hourly' THEN vs.current_salary * 160 ELSE vs.current_salary END)
        ELSE NULL
    END AS monthly_margin,

    -- Bench calculation (days on bench)
    CASE
        WHEN p.status = 'bench' THEN
            CURRENT_DATE - COALESCE(
                (SELECT MAX(end_date) FROM assignments WHERE person_id = p.id),
                p.created_at::date
            )
        ELSE 0
    END AS bench_days,

    -- Latest review health
    vr.latest_health,
    vr.latest_score,
    vr.period AS latest_review_period,

    -- Contract expiry
    ve.next_expiry_date,
    ve.days_until_expiry
FROM people p
LEFT JOIN view_person_active_assignment va ON va.person_id = p.id
LEFT JOIN view_person_latest_salary vs ON vs.person_id = p.id
LEFT JOIN view_person_latest_review vr ON vr.person_id = p.id
LEFT JOIN view_person_next_contract_expiry ve ON ve.person_id = p.id
WHERE p.archived_at IS NULL;

-- ============================================================================
-- 6. SECURITY HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.users WHERE auth_id = auth.uid() OR email = (auth.jwt() ->> 'email') LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid() OR email = (auth.jwt() ->> 'email') LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN AS $$
    SELECT public.current_user_role() IN ('admin', 'hr_manager');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS: users
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert and update users" ON users;
CREATE POLICY "Admins can insert and update users" ON users FOR ALL USING (
    public.current_user_role() = 'admin' OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: people
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "People view policy" ON people;
CREATE POLICY "People view policy" ON people FOR SELECT USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter', 'viewer', 'account_manager')
    OR auth.role() = 'service_role'
    OR public.current_user_role() IS NULL
);

DROP POLICY IF EXISTS "People insert policy" ON people;
CREATE POLICY "People insert policy" ON people FOR INSERT WITH CHECK (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
    OR public.current_user_role() IS NULL
);

DROP POLICY IF EXISTS "People update policy" ON people;
CREATE POLICY "People update policy" ON people FOR UPDATE USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "People delete policy (admin only)" ON people;
CREATE POLICY "People delete policy (admin only)" ON people FOR DELETE USING (
    public.current_user_role() = 'admin' OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: clients
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Clients select policy" ON clients;
CREATE POLICY "Clients select policy" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients mutate policy" ON clients;
CREATE POLICY "Clients mutate policy" ON clients FOR ALL USING (
    public.current_user_role() IN ('admin', 'hr_manager') OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: openings
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Openings select policy" ON openings;
CREATE POLICY "Openings select policy" ON openings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Openings mutate policy" ON openings;
CREATE POLICY "Openings mutate policy" ON openings FOR ALL USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter') OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: pipeline_stages
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Stages select policy" ON pipeline_stages;
CREATE POLICY "Stages select policy" ON pipeline_stages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Stages mutate policy" ON pipeline_stages;
CREATE POLICY "Stages mutate policy" ON pipeline_stages FOR ALL USING (
    public.current_user_role() = 'admin' OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: applications
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applications select policy" ON applications;
CREATE POLICY "Applications select policy" ON applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Applications mutate policy" ON applications;
CREATE POLICY "Applications mutate policy" ON applications FOR ALL USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
    OR public.current_user_role() IS NULL
);

-- ----------------------------------------------------------------------------
-- RLS: interviews & scorecards
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Interviews select policy" ON interviews;
CREATE POLICY "Interviews select policy" ON interviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Interviews mutate policy" ON interviews;
CREATE POLICY "Interviews mutate policy" ON interviews FOR ALL USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Scorecards select policy" ON scorecards;
CREATE POLICY "Scorecards select policy" ON scorecards FOR SELECT USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter', 'viewer') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Scorecards mutate policy" ON scorecards;
CREATE POLICY "Scorecards mutate policy" ON scorecards FOR ALL USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR interviewer_id = public.current_user_id()
    OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: assignments
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Assignments select policy" ON assignments;
CREATE POLICY "Assignments select policy" ON assignments FOR SELECT USING (
    public.is_admin_or_hr()
    OR public.current_user_role() IN ('recruiter', 'viewer')
    OR (public.current_user_role() = 'account_manager' AND account_manager_id = public.current_user_id())
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Assignments mutate policy" ON assignments;
CREATE POLICY "Assignments mutate policy" ON assignments FOR ALL USING (
    public.is_admin_or_hr() OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: compensation_records
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Compensation select policy" ON compensation_records;
CREATE POLICY "Compensation select policy" ON compensation_records FOR SELECT USING (
    public.is_admin_or_hr() OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Compensation insert policy" ON compensation_records;
CREATE POLICY "Compensation insert policy" ON compensation_records FOR INSERT WITH CHECK (
    public.is_admin_or_hr() OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Compensation no-update policy" ON compensation_records;
CREATE POLICY "Compensation no-update policy" ON compensation_records FOR UPDATE USING (
    public.current_user_role() = 'admin' OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Compensation no-delete policy" ON compensation_records;
CREATE POLICY "Compensation no-delete policy" ON compensation_records FOR DELETE USING (
    public.current_user_role() = 'admin' OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: contracts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Contracts select policy" ON contracts;
CREATE POLICY "Contracts select policy" ON contracts FOR SELECT USING (
    public.is_admin_or_hr()
    OR (
        public.current_user_role() = 'account_manager'
        AND type = 'client_sow'
        AND client_id IN (SELECT id FROM clients WHERE account_manager_id = public.current_user_id())
    )
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Contracts mutate policy" ON contracts;
CREATE POLICY "Contracts mutate policy" ON contracts FOR ALL USING (
    public.is_admin_or_hr() OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: documents
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Documents select policy" ON documents;
CREATE POLICY "Documents select policy" ON documents FOR SELECT USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter', 'viewer', 'account_manager')
    OR auth.role() = 'service_role'
    OR public.current_user_role() IS NULL
);

DROP POLICY IF EXISTS "Documents mutate policy" ON documents;
CREATE POLICY "Documents mutate policy" ON documents FOR ALL USING (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Documents insert policy" ON documents;
CREATE POLICY "Documents insert policy" ON documents FOR INSERT WITH CHECK (
    public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
    OR auth.role() = 'service_role'
    OR public.current_user_role() IS NULL
);

-- ----------------------------------------------------------------------------
-- RLS: reviews
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reviews select policy" ON reviews;
CREATE POLICY "Reviews select policy" ON reviews FOR SELECT USING (
    public.is_admin_or_hr()
    OR public.current_user_role() = 'viewer'
    OR (public.current_user_role() = 'account_manager' AND (
        reviewer_id = public.current_user_id()
        OR assignment_id IN (SELECT id FROM assignments WHERE account_manager_id = public.current_user_id())
    ))
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Reviews mutate policy" ON reviews;
CREATE POLICY "Reviews mutate policy" ON reviews FOR ALL USING (
    public.is_admin_or_hr()
    OR (public.current_user_role() = 'account_manager' AND (
        reviewer_id = public.current_user_id()
        OR assignment_id IN (SELECT id FROM assignments WHERE account_manager_id = public.current_user_id())
    ))
    OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: action_items
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Action items select policy" ON action_items;
CREATE POLICY "Action items select policy" ON action_items FOR SELECT USING (
    public.is_admin_or_hr()
    OR public.current_user_role() IN ('viewer', 'account_manager')
    OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Action items mutate policy" ON action_items;
CREATE POLICY "Action items mutate policy" ON action_items FOR ALL USING (
    public.is_admin_or_hr()
    OR owner_id = public.current_user_id()
    OR auth.role() = 'service_role'
);

-- ----------------------------------------------------------------------------
-- RLS: activity_log
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Activity log select policy" ON activity_log;
CREATE POLICY "Activity log select policy" ON activity_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "Activity log insert policy" ON activity_log;
CREATE POLICY "Activity log insert policy" ON activity_log FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 8. STORAGE BUCKETS & POLICIES ('documents' bucket)
-- ============================================================================

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

DROP POLICY IF EXISTS "Documents storage insert policy" ON storage.objects;
CREATE POLICY "Documents storage insert policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (
        public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
        OR auth.role() = 'service_role'
        OR public.current_user_role() IS NULL
    )
);

DROP POLICY IF EXISTS "Documents storage select policy" ON storage.objects;
CREATE POLICY "Documents storage select policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents'
    AND (
        public.current_user_role() IN ('admin', 'hr_manager', 'recruiter', 'viewer', 'account_manager')
        OR auth.role() = 'service_role'
        OR public.current_user_role() IS NULL
    )
);

DROP POLICY IF EXISTS "Documents storage update policy" ON storage.objects;
CREATE POLICY "Documents storage update policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documents'
    AND (
        public.current_user_role() IN ('admin', 'hr_manager', 'recruiter')
        OR auth.role() = 'service_role'
    )
);

DROP POLICY IF EXISTS "Documents storage delete policy" ON storage.objects;
CREATE POLICY "Documents storage delete policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents'
    AND (
        public.current_user_role() IN ('admin', 'hr_manager')
        OR auth.role() = 'service_role'
    )
);

-- ============================================================================
-- 9. SEED DATA (Clean Refresh)
-- ============================================================================

DELETE FROM activity_log;
DELETE FROM action_items;
DELETE FROM reviews;
DELETE FROM documents;
DELETE FROM contracts;
DELETE FROM compensation_records;
DELETE FROM assignments;
DELETE FROM scorecards;
DELETE FROM interviews;
DELETE FROM applications;
DELETE FROM pipeline_stages;
DELETE FROM openings;
DELETE FROM clients;
DELETE FROM people;
DELETE FROM users;

-- 9.1 Seed Users
INSERT INTO users (id, auth_id, email, name, role, avatar_url) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'david@ultrix.digital', 'David (Admin / Ops Lead)', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'elena.hr@ultrix.digital', 'Elena Rostova (HR Lead)', 'hr_manager', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
    ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'lucas.recruiter@ultrix.digital', 'Lucas Bennett (Talent Acquisition)', 'recruiter', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('44444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'marcos.am@ultrix.digital', 'Marcos Valenzuela (Account Manager)', 'account_manager', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
    ('55555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'sofia.viewer@ultrix.digital', 'Sofia Chen (Finance / Leadership)', 'viewer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
    ('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'new.staff@ultrix.digital', 'Alex Pending (New User)', 'unassigned', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');

-- 9.2 Pipeline Stages
INSERT INTO pipeline_stages (id, name, stage_order, is_terminal) VALUES
    ('00000001-0000-0000-0000-000000000001', 'Applied', 1, false),
    ('00000001-0000-0000-0000-000000000002', 'Screening', 2, false),
    ('00000001-0000-0000-0000-000000000003', 'Technical interview', 3, false),
    ('00000001-0000-0000-0000-000000000004', 'Client interview', 4, false),
    ('00000001-0000-0000-0000-000000000005', 'Offer', 5, false),
    ('00000001-0000-0000-0000-000000000006', 'Hired', 6, true),
    ('00000001-0000-0000-0000-000000000007', 'Rejected', 7, true);

-- 9.3 Clients
INSERT INTO clients (id, name, contact_name, contact_email, timezone, account_manager_id, active, created_by) VALUES
    ('c1111111-0000-0000-0000-000000000001', 'Nexus Fintech Corp', 'Sarah Jenkins', 'sarah.j@nexusfintech.io', 'America/New_York (EST)', '44444444-4444-4444-4444-444444444444', true, '11111111-1111-1111-1111-111111111111'),
    ('c1111111-0000-0000-0000-000000000002', 'Aura Health Logistics', 'Dr. Aris Thorne', 'athorne@aurahealth.co', 'America/Los_Angeles (PST)', '44444444-4444-4444-4444-444444444444', true, '11111111-1111-1111-1111-111111111111'),
    ('c1111111-0000-0000-0000-000000000003', 'Starlight Media Inc', 'Claire O''Connor', 'claire@starlightmedia.uk', 'Europe/London (GMT)', '44444444-4444-4444-4444-444444444444', true, '11111111-1111-1111-1111-111111111111');

-- 9.4 Openings
INSERT INTO openings (id, title, client_id, seniority, stack, salary_min, salary_max, bill_rate_min, bill_rate_max, currency, headcount, status, owner_id, created_by) VALUES
    ('b1000001-0000-0000-0000-000000000001', 'Senior Full-Stack React / Node Engineer', 'c1111111-0000-0000-0000-000000000001', 'Senior', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'], 4500, 5500, 8000, 9500, 'USD', 2, 'Open', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
    ('b1000001-0000-0000-0000-000000000002', 'Staff AI / Python Data Engineer', 'c1111111-0000-0000-0000-000000000002', 'Lead', ARRAY['Python', 'FastAPI', 'LangChain', 'PostgreSQL', 'Docker'], 5500, 7000, 10000, 12000, 'USD', 1, 'Open', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
    ('b1000001-0000-0000-0000-000000000003', 'Senior Cloud DevOps Engineer', 'c1111111-0000-0000-0000-000000000003', 'Senior', ARRAY['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions'], 5000, 6200, 8500, 10500, 'USD', 1, 'On hold', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');

-- 9.5 People (Workers & Candidates)
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by) VALUES
    ('a1000001-0000-0000-0000-000000000001', 'Mateo Rossi', 'mateo.rossi@devlatam.io', '+54 9 11 4589 1234', 'Argentina', 'America/Argentina/Buenos_Aires (ART)', 'active', 'C1', 'Senior', ARRAY['React', 'TypeScript', 'Next.js', 'Node.js', 'PostgreSQL'], 'https://linkedin.com/in/mateorossi-fake', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 5000, 'USD', '2026-01-15', '22222222-2222-2222-2222-222222222222'),
    ('a1000001-0000-0000-0000-000000000002', 'Camila Alvarez', 'camila.alvarez@codeflow.co', '+57 310 987 6543', 'Colombia', 'America/Bogota (COT)', 'active', 'B2', 'Senior', ARRAY['Python', 'Django', 'FastAPI', 'Docker', 'AWS'], 'https://linkedin.com/in/camilaalvarez-fake', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 4800, 'USD', '2026-03-01', '22222222-2222-2222-2222-222222222222'),
    ('a1000001-0000-0000-0000-000000000003', 'Santiago Diaz', 'santiago.diaz@infraops.net', '+56 9 8765 4321', 'Chile', 'America/Santiago (CLT)', 'bench', 'C2', 'Lead', ARRAY['Kubernetes', 'Terraform', 'AWS', 'GCP', 'CI/CD'], 'https://linkedin.com/in/santiagodiaz-fake', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 6000, 'USD', '2026-10-01', '22222222-2222-2222-2222-222222222222'),
    ('a1000001-0000-0000-0000-000000000004', 'Valentina Gomez', 'valen.gomez@techcraft.dev', '+55 11 98888 7777', 'Brazil', 'America/Sao_Paulo (BRT)', 'onboarding', 'C1', 'Mid', ARRAY['React Native', 'TypeScript', 'Redux', 'GraphQL'], 'https://linkedin.com/in/valentinagomez-fake', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 4000, 'USD', '2026-11-01', '33333333-3333-3333-3333-333333333333'),
    ('a1000001-0000-0000-0000-000000000005', 'Ignacio Silva', 'ignacio.silva@coderlatam.io', '+54 9 351 123 4567', 'Argentina', 'America/Argentina/Cordoba', 'candidate', 'B2', 'Senior', ARRAY['React', 'Next.js', 'Tailwind', 'GraphQL'], 'https://linkedin.com/in/ignaciosilva-fake', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 5000, 'USD', '2026-11-15', '33333333-3333-3333-3333-333333333333'),
    ('a1000001-0000-0000-0000-000000000006', 'Lucia Fernandez', 'lucia.f@latamstack.org', '+598 99 123 456', 'Uruguay', 'America/Montevideo (UYT)', 'rejected', 'B1', 'Mid', ARRAY['Python', 'Django', 'PostgreSQL'], 'https://linkedin.com/in/luciafernandez-fake', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 3500, 'USD', '2026-08-01', '33333333-3333-3333-3333-333333333333');

-- 9.6 Contracts
INSERT INTO contracts (id, person_id, client_id, type, status, signed_date, start_date, end_date, file_path, file_name, created_by) VALUES
    ('c2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', NULL, 'contractor_agreement', 'Signed', '2026-01-10', '2026-01-15', '2027-01-15', 'contracts/mateo_rossi_contractor_agmt.pdf', 'mateo_rossi_contractor_agmt.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', NULL, 'nda', 'Signed', '2026-01-10', '2026-01-15', NULL, 'contracts/mateo_rossi_nda.pdf', 'mateo_rossi_nda.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'client_sow', 'Signed', '2026-01-12', '2026-01-15', '2027-01-15', 'contracts/nexus_mateo_sow.pdf', 'nexus_mateo_sow.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000002', NULL, 'contractor_agreement', 'Signed', '2026-03-01', '2026-03-01', CURRENT_DATE + INTERVAL '20 days', 'contracts/camila_alvarez_contractor_agmt.pdf', 'camila_alvarez_contractor_agmt.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000002', NULL, 'nda', 'Signed', '2026-03-01', '2026-03-01', NULL, 'contracts/camila_alvarez_nda.pdf', 'camila_alvarez_nda.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000006', 'a1000001-0000-0000-0000-000000000003', NULL, 'contractor_agreement', 'Signed', '2025-06-01', '2025-06-01', '2026-06-01', 'contracts/santiago_contractor.pdf', 'santiago_contractor.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000007', 'a1000001-0000-0000-0000-000000000003', NULL, 'nda', 'Signed', '2025-06-01', '2025-06-01', NULL, 'contracts/santiago_nda.pdf', 'santiago_nda.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000004', NULL, 'contractor_agreement', 'Sent', NULL, '2026-11-01', '2027-11-01', 'contracts/valentina_draft_agmt.pdf', 'valentina_draft_agmt.pdf', '22222222-2222-2222-2222-222222222222');

-- 9.7 Assignments
INSERT INTO assignments (id, person_id, client_id, role_title, start_date, end_date, hours_per_week, bill_rate, bill_rate_unit, currency, account_manager_id, status, created_by) VALUES
    ('d2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'Lead React Engineer', '2026-01-15', NULL, 40, 9000, 'monthly', 'USD', '44444444-4444-4444-4444-444444444444', 'Active', '11111111-1111-1111-1111-111111111111'),
    ('d2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000002', 'Senior Backend Engineer', '2026-03-01', NULL, 40, 8500, 'monthly', 'USD', '44444444-4444-4444-4444-444444444444', 'Active', '11111111-1111-1111-1111-111111111111'),
    ('d2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000003', 'Staff DevOps Lead', '2025-06-01', CURRENT_DATE - INTERVAL '22 days', 40, 10000, 'monthly', 'USD', '44444444-4444-4444-4444-444444444444', 'Ended', '11111111-1111-1111-1111-111111111111');

-- 9.8 Compensation Records
INSERT INTO compensation_records (id, person_id, amount, currency, frequency, engagement_type, effective_date, reason, created_by) VALUES
    ('e1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 4500, 'USD', 'monthly', 'contractor', '2026-01-15', 'hire', '22222222-2222-2222-2222-222222222222'),
    ('e1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 5000, 'USD', 'monthly', 'contractor', '2026-07-01', 'raise', '22222222-2222-2222-2222-222222222222'),
    ('e1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 4800, 'USD', 'monthly', 'contractor', '2026-03-01', 'hire', '22222222-2222-2222-2222-222222222222'),
    ('e1000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000003', 6000, 'USD', 'monthly', 'contractor', '2025-06-01', 'hire', '22222222-2222-2222-2222-222222222222');

-- 9.9 Documents
INSERT INTO documents (id, person_id, type, file_path, file_name, file_size, mime_type, created_by) VALUES
    ('dc000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'cv', 'cvs/mateo_rossi_cv_2026.pdf', 'mateo_rossi_cv_2026.pdf', 384920, 'application/pdf', '33333333-3333-3333-3333-333333333333'),
    ('dc000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 'id_copy', 'ids/mateo_rossi_dni.pdf', 'mateo_rossi_dni.pdf', 1248000, 'application/pdf', '22222222-2222-2222-2222-222222222222'),
    ('dc000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'cv', 'cvs/camila_alvarez_cv.pdf', 'camila_alvarez_cv.pdf', 295000, 'application/pdf', '33333333-3333-3333-3333-333333333333'),
    ('dc000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000005', 'cv', 'cvs/ignacio_silva_resume.pdf', 'ignacio_silva_resume.pdf', 412000, 'application/pdf', '33333333-3333-3333-3333-333333333333');

-- 9.10 Applications, Interviews & Scorecards
INSERT INTO applications (id, person_id, opening_id, stage_id, stage_changed_at, source, created_by) VALUES
    ('a2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000005', 'b1000001-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000003', now() - INTERVAL '8 days', 'LinkedIn InMail', '33333333-3333-3333-3333-333333333333');

INSERT INTO interviews (id, application_id, type, scheduled_at, interviewer_ids, meeting_url, created_by) VALUES
    ('e2000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000001', 'Technical interview', now() - INTERVAL '7 days', ARRAY['11111111-1111-1111-1111-111111111111'::uuid], 'https://meet.google.com/ult-tech-ign', '33333333-3333-3333-3333-333333333333');

INSERT INTO scorecards (id, interview_id, interviewer_id, technical, english, communication, culture_fit, recommendation, notes) VALUES
    ('5c000001-0000-0000-0000-000000000001', 'e2000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 3, 3, 4, 4, 'Yes', 'Solid React architecture knowledge and clean component patterns. English is intermediate (B2), sufficient for client syncs.');

INSERT INTO applications (id, person_id, opening_id, stage_id, stage_changed_at, rejection_reason, rejection_notes, source, created_by) VALUES
    ('a2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000006', 'b1000001-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000007', now() - INTERVAL '30 days', 'english', 'Great Python skills but client requires fluent English (C1). Preserved for LATAM-only clients.', 'Direct Referral', '33333333-3333-3333-3333-333333333333');

-- 9.11 Reviews
INSERT INTO reviews (id, person_id, assignment_id, period, reviewer_id, due_date, status, rating_delivery, rating_communication, rating_reliability, rating_proactivity, rating_client_satisfaction, average_score, client_feedback, feedback_source, wins, concerns, attendance_issues, health, submitted_at, acknowledged_by, acknowledged_at) VALUES
    ('f1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'd2000001-0000-0000-0000-000000000001', '2026-10', '44444444-4444-4444-4444-444444444444', '2026-10-10', 'Acknowledged by HR', 5, 5, 5, 4, 5, 4.80, 'Sarah Jenkins (VP Eng): "Mateo is one of our best external engineers. Shipped the checkout migration 2 weeks ahead of schedule."', 'Monthly sync call with Sarah Jenkins', 'Delivered the checkout refactor ahead of deadline; praised in company all-hands.', 'None.', 'No issues, 100% on-time attendance.', 'Green', '2026-10-08 14:30:00Z', '22222222-2222-2222-2222-222222222222', '2026-10-09 10:15:00Z'),
    ('f1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 'd2000001-0000-0000-0000-000000000001', '2026-09', '44444444-4444-4444-4444-444444444444', '2026-09-10', 'Acknowledged by HR', 4, 4, 5, 4, 4, 4.20, 'Solid sprint outputs.', 'Email report', 'Maintained 99.9% uptime during payments release.', 'None.', 'None.', 'Green', '2026-09-08 16:00:00Z', '22222222-2222-2222-2222-222222222222', '2026-09-09 11:00:00Z'),
    ('f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000002', '2026-10', '44444444-4444-4444-4444-444444444444', '2026-10-10', 'Submitted', 2, 2, 3, 2, 2, 2.20, 'Dr. Aris Thorne: "Camila missed two critical sprint deliverables and had communication blackouts during standup without notice."', 'Slack escalation from Dr. Thorne', 'Helped fix a critical database query lock on Tuesday.', 'Missed sprint commitments and slow response time on Slack.', 'Unannounced absence during client demo on Oct 4.', 'Red', '2026-10-10 18:20:00Z', NULL, NULL);

-- 9.12 Action Items
INSERT INTO action_items (id, review_id, person_id, description, owner_id, due_date, done) VALUES
    ('f2000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'Schedule 1-on-1 alignment call with Camila regarding communication SLAs', '22222222-2222-2222-2222-222222222222', CURRENT_DATE + INTERVAL '2 days', false),
    ('f2000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'Establish daily Slack check-in protocol with Account Manager Marcos', '44444444-4444-4444-4444-444444444444', CURRENT_DATE + INTERVAL '3 days', false);

-- 9.13 Activity Log
INSERT INTO activity_log (id, entity_type, entity_id, person_id, actor_id, action, diff, note, created_at) VALUES
    ('f3000001-0000-0000-0000-000000000001', 'people', 'a1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'status_change', '{"before": "onboarding", "after": "active"}'::jsonb, 'Active Gate verified: Signed contractor agreement and NDA confirmed on file.', now() - INTERVAL '10 months'),
    ('f3000001-0000-0000-0000-000000000002', 'compensation', 'e1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'compensation_raise', '{"old_salary": 4500, "new_salary": 5000}'::jsonb, 'Mid-year performance raise approved by HR.', now() - INTERVAL '3 months'),
    ('f3000001-0000-0000-0000-000000000003', 'reviews', 'f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'red_health_alert', '{"health": "Red", "score": 2.2}'::jsonb, 'CRITICAL: Account Manager submitted review with RED health. Action plan initiated.', now() - INTERVAL '9 days');
