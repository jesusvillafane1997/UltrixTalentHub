-- Ultrix Talent Hub: Initial Schema & Row Level Security (RLS)
-- Migration 00001
-- Author: David / Antigravity AI Engineering
-- Date: 2026-10-19

SET search_path = public, extensions;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS AND DOMAINS (Safely created if not already existing)
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
-- 2. CORE TABLES
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

-- Table 2: people (Candidates & Workers in one table)
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

-- Table 9: assignments (Links worker to client - SENSITIVE)
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

-- Table 10: compensation_records (SENSITIVE - Append-only)
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

-- Table 11: contracts (SENSITIVE)
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

-- Table 12: documents (CVs, IDs, Certs)
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

-- Table 14: action_items
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

-- Table 15: activity_log (Audit trail & notes)
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
-- 3. THE "ACTIVE GATE" ENFORCEMENT TRIGGER
-- A worker cannot be marked Active without a Signed contractor agreement and NDA
-- ============================================================================

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

-- ============================================================================
-- 4. UPDATED_AT TIMESTAMP TRIGGER
-- ============================================================================

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
-- 5. DERIVED VIEWS (Current Salary, Assignment, Margin, Bench, Health)
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

-- Master Workforce View with derived metrics
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
    
    -- Automated Margin: bill_rate - salary (normalized to monthly)
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
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Helper function: get current user role
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
