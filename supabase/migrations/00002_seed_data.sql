-- Ultrix Talent Hub: Seed Data Migration
-- Migration 00002
-- Author: David / Antigravity AI Engineering
-- Date: 2026-10-19

-- Clean previous seeds if needed
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

-- ============================================================================
-- 1. SEED APP USERS (Covering all 5 Roles + Unassigned)
-- ============================================================================

INSERT INTO users (id, auth_id, email, name, role, avatar_url) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'david@ultrix.digital', 'David (Admin / Ops Lead)', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    ('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'elena.hr@ultrix.digital', 'Elena Rostova (HR Lead)', 'hr_manager', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
    ('33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'lucas.recruiter@ultrix.digital', 'Lucas Bennett (Talent Acquisition)', 'recruiter', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
    ('44444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'marcos.am@ultrix.digital', 'Marcos Valenzuela (Account Manager)', 'account_manager', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
    ('55555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'sofia.viewer@ultrix.digital', 'Sofia Chen (Finance / Leadership)', 'viewer', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
    ('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'new.staff@ultrix.digital', 'Alex Pending (New User)', 'unassigned', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');

-- ============================================================================
-- 2. PIPELINE STAGES
-- ============================================================================

INSERT INTO pipeline_stages (id, name, stage_order, is_terminal) VALUES
    ('00000001-0000-0000-0000-000000000001', 'Applied', 1, false),
    ('00000001-0000-0000-0000-000000000002', 'Screening', 2, false),
    ('00000001-0000-0000-0000-000000000003', 'Technical interview', 3, false),
    ('00000001-0000-0000-0000-000000000004', 'Client interview', 4, false),
    ('00000001-0000-0000-0000-000000000005', 'Offer', 5, false),
    ('00000001-0000-0000-0000-000000000006', 'Hired', 6, true),
    ('00000001-0000-0000-0000-000000000007', 'Rejected', 7, true);

-- ============================================================================
-- 3. CLIENTS
-- ============================================================================

INSERT INTO clients (id, name, contact_name, contact_email, timezone, account_manager_id, active, created_by) VALUES
    ('c1111111-0000-0000-0000-000000000001', 'Nexus Fintech Corp', 'Sarah Jenkins', 'sarah.j@nexusfintech.io', 'America/New_York (EST)', '44444444-4444-4444-4444-444444444444', true, '11111111-1111-1111-1111-111111111111'),
    ('c1111111-0000-0000-0000-000000000002', 'Aura Health Logistics', 'Dr. Aris Thorne', 'athorne@aurahealth.co', 'America/Los_Angeles (PST)', '44444444-4444-4444-4444-444444444444', true, '11111111-1111-1111-1111-111111111111'),
    ('c1111111-0000-0000-0000-000000000003', 'Starlight Media Inc', 'Claire O''Connor', 'claire@starlightmedia.uk', 'Europe/London (GMT)', '44444444-4444-4444-4444-444444444444', true, '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- 4. OPENINGS
-- ============================================================================

INSERT INTO openings (id, title, client_id, seniority, stack, salary_min, salary_max, bill_rate_min, bill_rate_max, currency, headcount, status, owner_id, created_by) VALUES
    ('b1000001-0000-0000-0000-000000000001', 'Senior Full-Stack React / Node Engineer', 'c1111111-0000-0000-0000-000000000001', 'Senior', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'], 4500, 5500, 8000, 9500, 'USD', 2, 'Open', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
    ('b1000001-0000-0000-0000-000000000002', 'Staff AI / Python Data Engineer', 'c1111111-0000-0000-0000-000000000002', 'Lead', ARRAY['Python', 'FastAPI', 'LangChain', 'PostgreSQL', 'Docker'], 5500, 7000, 10000, 12000, 'USD', 1, 'Open', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
    ('b1000001-0000-0000-0000-000000000003', 'Senior Cloud DevOps Engineer', 'c1111111-0000-0000-0000-000000000003', 'Senior', ARRAY['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions'], 5000, 6200, 8500, 10500, 'USD', 1, 'On hold', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- 5. PEOPLE (Candidates & Workers)
-- ============================================================================

-- Worker 1: Active with Nexus Fintech, high performance
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by) VALUES
    ('a1000001-0000-0000-0000-000000000001', 'Mateo Rossi', 'mateo.rossi@devlatam.io', '+54 9 11 4589 1234', 'Argentina', 'America/Argentina/Buenos_Aires (ART)', 'active', 'C1', 'Senior', ARRAY['React', 'TypeScript', 'Next.js', 'Node.js', 'PostgreSQL'], 'https://linkedin.com/in/mateorossi-fake', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', 5000, 'USD', '2026-01-15', '22222222-2222-2222-2222-222222222222');

-- Worker 2: Active with Aura Health, currently RED health alert
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by) VALUES
    ('a1000001-0000-0000-0000-000000000002', 'Camila Alvarez', 'camila.alvarez@codeflow.co', '+57 310 987 6543', 'Colombia', 'America/Bogota (COT)', 'active', 'B2', 'Senior', ARRAY['Python', 'Django', 'FastAPI', 'Docker', 'AWS'], 'https://linkedin.com/in/camilaalvarez-fake', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 4800, 'USD', '2026-03-01', '22222222-2222-2222-2222-222222222222');

-- Worker 3: Bench worker (>14 days bench)
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000003', 'Santiago Diaz', 'santiago.diaz@infraops.net', '+56 9 8765 4321', 'Chile', 'America/Santiago (CLT)', 'bench', 'C2', 'Lead', ARRAY['Kubernetes', 'Terraform', 'AWS', 'GCP', 'CI/CD'], 'https://linkedin.com/in/santiagodiaz-fake', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', 6000, 'USD', '2026-10-01', '22222222-2222-2222-2222-222222222222', now() - INTERVAL '22 days');

-- Person 4: Onboarding worker (Offer accepted, signing contracts)
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by) VALUES
    ('a1000001-0000-0000-0000-000000000004', 'Valentina Gomez', 'valen.gomez@techcraft.dev', '+55 11 98888 7777', 'Brazil', 'America/Sao_Paulo (BRT)', 'onboarding', 'C1', 'Mid', ARRAY['React Native', 'TypeScript', 'Redux', 'GraphQL'], 'https://linkedin.com/in/valentinagomez-fake', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 4000, 'USD', '2026-11-01', '33333333-3333-3333-3333-333333333333');

-- Person 5: Candidate in Technical Interview (Stuck for 8 days -> trigger stuck alert)
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by) VALUES
    ('a1000001-0000-0000-0000-000000000005', 'Ignacio Silva', 'ignacio.silva@coderlatam.io', '+54 9 351 123 4567', 'Argentina', 'America/Argentina/Cordoba', 'candidate', 'B2', 'Senior', ARRAY['React', 'Next.js', 'Tailwind', 'GraphQL'], 'https://linkedin.com/in/ignaciosilva-fake', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 5000, 'USD', '2026-11-15', '33333333-3333-3333-3333-333333333333');

-- Person 6: Rejected Candidate (Reusable Talent Pool)
INSERT INTO people (id, full_name, email, phone, country, timezone, status, english_level, seniority, skills, linkedin_url, photo_url, salary_expectation, salary_currency, availability_date, created_by) VALUES
    ('a1000001-0000-0000-0000-000000000006', 'Lucia Fernandez', 'lucia.f@latamstack.org', '+598 99 123 456', 'Uruguay', 'America/Montevideo (UYT)', 'rejected', 'B1', 'Mid', ARRAY['Python', 'Django', 'PostgreSQL'], 'https://linkedin.com/in/luciafernandez-fake', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 3500, 'USD', '2026-08-01', '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 6. CONTRACTS (Required before Active status)
-- ============================================================================

-- Contracts for Mateo Rossi
INSERT INTO contracts (id, person_id, client_id, type, status, signed_date, start_date, end_date, file_path, file_name, created_by) VALUES
    ('c2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', NULL, 'contractor_agreement', 'Signed', '2026-01-10', '2026-01-15', '2027-01-15', 'contracts/mateo_rossi_contractor_agmt.pdf', 'mateo_rossi_contractor_agmt.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', NULL, 'nda', 'Signed', '2026-01-10', '2026-01-15', NULL, 'contracts/mateo_rossi_nda.pdf', 'mateo_rossi_nda.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'client_sow', 'Signed', '2026-01-12', '2026-01-15', '2027-01-15', 'contracts/nexus_mateo_sow.pdf', 'nexus_mateo_sow.pdf', '22222222-2222-2222-2222-222222222222');

-- Contracts for Camila Alvarez (With 30-day expiry ending in 20 days -> triggers contract expiry alert!)
INSERT INTO contracts (id, person_id, client_id, type, status, signed_date, start_date, end_date, file_path, file_name, created_by) VALUES
    ('c2000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000002', NULL, 'contractor_agreement', 'Signed', '2026-03-01', '2026-03-01', CURRENT_DATE + INTERVAL '20 days', 'contracts/camila_alvarez_contractor_agmt.pdf', 'camila_alvarez_contractor_agmt.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000002', NULL, 'nda', 'Signed', '2026-03-01', '2026-03-01', NULL, 'contracts/camila_alvarez_nda.pdf', 'camila_alvarez_nda.pdf', '22222222-2222-2222-2222-222222222222');

-- Contracts for Santiago Diaz (Bench worker)
INSERT INTO contracts (id, person_id, client_id, type, status, signed_date, start_date, end_date, file_path, file_name, created_by) VALUES
    ('c2000001-0000-0000-0000-000000000006', 'a1000001-0000-0000-0000-000000000003', NULL, 'contractor_agreement', 'Signed', '2025-06-01', '2025-06-01', '2026-06-01', 'contracts/santiago_contractor.pdf', 'santiago_contractor.pdf', '22222222-2222-2222-2222-222222222222'),
    ('c2000001-0000-0000-0000-000000000007', 'a1000001-0000-0000-0000-000000000003', NULL, 'nda', 'Signed', '2025-06-01', '2025-06-01', NULL, 'contracts/santiago_nda.pdf', 'santiago_nda.pdf', '22222222-2222-2222-2222-222222222222');

-- Contracts for Valentina Gomez (Draft / Sent status for onboarding)
INSERT INTO contracts (id, person_id, client_id, type, status, signed_date, start_date, end_date, file_path, file_name, created_by) VALUES
    ('c2000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000004', NULL, 'contractor_agreement', 'Sent', NULL, '2026-11-01', '2027-11-01', 'contracts/valentina_draft_agmt.pdf', 'valentina_draft_agmt.pdf', '22222222-2222-2222-2222-222222222222');

-- ============================================================================
-- 7. ASSIGNMENTS (Linking workers to clients)
-- ============================================================================

-- Mateo Rossi at Nexus Fintech ($9,000 bill rate, $5,000 cost -> $4,000 margin)
INSERT INTO assignments (id, person_id, client_id, role_title, start_date, end_date, hours_per_week, bill_rate, bill_rate_unit, currency, account_manager_id, status, created_by) VALUES
    ('d2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'Lead React Engineer', '2026-01-15', NULL, 40, 9000, 'monthly', 'USD', '44444444-4444-4444-4444-444444444444', 'Active', '11111111-1111-1111-1111-111111111111');

-- Camila Alvarez at Aura Health ($8,500 bill rate, $4,800 cost -> $3,700 margin)
INSERT INTO assignments (id, person_id, client_id, role_title, start_date, end_date, hours_per_week, bill_rate, bill_rate_unit, currency, account_manager_id, status, created_by) VALUES
    ('d2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000002', 'Senior Backend Engineer', '2026-03-01', NULL, 40, 8500, 'monthly', 'USD', '44444444-4444-4444-4444-444444444444', 'Active', '11111111-1111-1111-1111-111111111111');

-- Santiago Diaz previously at Starlight Media (Ended assignment -> on bench)
INSERT INTO assignments (id, person_id, client_id, role_title, start_date, end_date, hours_per_week, bill_rate, bill_rate_unit, currency, account_manager_id, status, created_by) VALUES
    ('d2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000003', 'Staff DevOps Lead', '2025-06-01', CURRENT_DATE - INTERVAL '22 days', 40, 10000, 'monthly', 'USD', '44444444-4444-4444-4444-444444444444', 'Ended', '11111111-1111-1111-1111-111111111111');

-- ============================================================================
-- 8. COMPENSATION RECORDS (Append-only salary history)
-- ============================================================================

INSERT INTO compensation_records (id, person_id, amount, currency, frequency, engagement_type, effective_date, reason, created_by) VALUES
    ('e1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 4500, 'USD', 'monthly', 'contractor', '2026-01-15', 'hire', '22222222-2222-2222-2222-222222222222'),
    ('e1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 5000, 'USD', 'monthly', 'contractor', '2026-07-01', 'raise', '22222222-2222-2222-2222-222222222222'),
    ('e1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 4800, 'USD', 'monthly', 'contractor', '2026-03-01', 'hire', '22222222-2222-2222-2222-222222222222'),
    ('e1000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000003', 6000, 'USD', 'monthly', 'contractor', '2025-06-01', 'hire', '22222222-2222-2222-2222-222222222222');

-- ============================================================================
-- 9. DOCUMENTS (CVs, IDs, Certs)
-- ============================================================================

INSERT INTO documents (id, person_id, type, file_path, file_name, file_size, mime_type, created_by) VALUES
    ('dc000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'cv', 'cvs/mateo_rossi_cv_2026.pdf', 'mateo_rossi_cv_2026.pdf', 384920, 'application/pdf', '33333333-3333-3333-3333-333333333333'),
    ('dc000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 'id_copy', 'ids/mateo_rossi_dni.pdf', 'mateo_rossi_dni.pdf', 1248000, 'application/pdf', '22222222-2222-2222-2222-222222222222'),
    ('dc000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'cv', 'cvs/camila_alvarez_cv.pdf', 'camila_alvarez_cv.pdf', 295000, 'application/pdf', '33333333-3333-3333-3333-333333333333'),
    ('dc000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000005', 'cv', 'cvs/ignacio_silva_resume.pdf', 'ignacio_silva_resume.pdf', 412000, 'application/pdf', '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 10. APPLICATIONS, INTERVIEWS & SCORECARDS
-- ============================================================================

-- Ignacio Silva applying to Nexus React Opening (Stuck in Technical Interview for 8 days)
INSERT INTO applications (id, person_id, opening_id, stage_id, stage_changed_at, source, created_by) VALUES
    ('a2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000005', 'b1000001-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000003', now() - INTERVAL '8 days', 'LinkedIn InMail', '33333333-3333-3333-3333-333333333333');

INSERT INTO interviews (id, application_id, type, scheduled_at, interviewer_ids, meeting_url, created_by) VALUES
    ('e2000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000001', 'Technical interview', now() - INTERVAL '7 days', ARRAY['11111111-1111-1111-1111-111111111111'::uuid], 'https://meet.google.com/ult-tech-ign', '33333333-3333-3333-3333-333333333333');

INSERT INTO scorecards (id, interview_id, interviewer_id, technical, english, communication, culture_fit, recommendation, notes) VALUES
    ('5c000001-0000-0000-0000-000000000001', 'e2000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 3, 3, 4, 4, 'Yes', 'Solid React architecture knowledge and clean component patterns. English is intermediate (B2), sufficient for client syncs.');

-- Lucia Fernandez (Rejected candidate with reason: english)
INSERT INTO applications (id, person_id, opening_id, stage_id, stage_changed_at, rejection_reason, rejection_notes, source, created_by) VALUES
    ('a2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000006', 'b1000001-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000007', now() - INTERVAL '30 days', 'english', 'Great Python skills but client requires fluent English (C1). Preserved for LATAM-only clients.', 'Direct Referral', '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 11. MONTHLY REVIEWS (Health Green & Red)
-- ============================================================================

-- Mateo Rossi: Consistent Green (October 2026)
INSERT INTO reviews (id, person_id, assignment_id, period, reviewer_id, due_date, status, rating_delivery, rating_communication, rating_reliability, rating_proactivity, rating_client_satisfaction, average_score, client_feedback, feedback_source, wins, concerns, attendance_issues, health, submitted_at, acknowledged_by, acknowledged_at) VALUES
    ('f1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', 'd2000001-0000-0000-0000-000000000001', '2026-10', '44444444-4444-4444-4444-444444444444', '2026-10-10', 'Acknowledged by HR', 5, 5, 5, 4, 5, 4.80, 'Sarah Jenkins (VP Eng): "Mateo is one of our best external engineers. Shipped the checkout migration 2 weeks ahead of schedule."', 'Monthly sync call with Sarah Jenkins', 'Delivered the checkout refactor ahead of deadline; praised in company all-hands.', 'None.', 'No issues, 100% on-time attendance.', 'Green', '2026-10-08 14:30:00Z', '22222222-2222-2222-2222-222222222222', '2026-10-09 10:15:00Z'),
    ('f1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', 'd2000001-0000-0000-0000-000000000001', '2026-09', '44444444-4444-4444-4444-444444444444', '2026-09-10', 'Acknowledged by HR', 4, 4, 5, 4, 4, 4.20, 'Solid sprint outputs.', 'Email report', 'Maintained 99.9% uptime during payments release.', 'None.', 'None.', 'Green', '2026-09-08 16:00:00Z', '22222222-2222-2222-2222-222222222222', '2026-09-09 11:00:00Z');

-- Camila Alvarez: RED health alert (October 2026 - Needs Action Plan!)
INSERT INTO reviews (id, person_id, assignment_id, period, reviewer_id, due_date, status, rating_delivery, rating_communication, rating_reliability, rating_proactivity, rating_client_satisfaction, average_score, client_feedback, feedback_source, wins, concerns, attendance_issues, health, submitted_at, acknowledged_by, acknowledged_at) VALUES
    ('f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'd2000001-0000-0000-0000-000000000002', '2026-10', '44444444-4444-4444-4444-444444444444', '2026-10-10', 'Submitted', 2, 2, 3, 2, 2, 2.20, 'Dr. Aris Thorne: "Camila missed two critical sprint deliverables and had communication blackouts during standup without notice."', 'Slack escalation from Dr. Thorne', 'Helped fix a critical database query lock on Tuesday.', 'Missed sprint commitments and slow response time on Slack.', 'Unannounced absence during client demo on Oct 4.', 'Red', '2026-10-10 18:20:00Z', NULL, NULL);

-- ============================================================================
-- 12. ACTION ITEMS (Tied to Camila's Red Review)
-- ============================================================================

INSERT INTO action_items (id, review_id, person_id, description, owner_id, due_date, done) VALUES
    ('f2000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'Schedule 1-on-1 alignment call with Camila regarding communication SLAs', '22222222-2222-2222-2222-222222222222', CURRENT_DATE + INTERVAL '2 days', false),
    ('f2000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', 'Establish daily Slack check-in protocol with Account Manager Marcos', '44444444-4444-4444-4444-444444444444', CURRENT_DATE + INTERVAL '3 days', false);

-- ============================================================================
-- 13. ACTIVITY LOG (Audit Trail)
-- ============================================================================

INSERT INTO activity_log (id, entity_type, entity_id, person_id, actor_id, action, diff, note, created_at) VALUES
    ('f3000001-0000-0000-0000-000000000001', 'people', 'a1000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'status_change', '{"before": "onboarding", "after": "active"}'::jsonb, 'Active Gate verified: Signed contractor agreement and NDA confirmed on file.', now() - INTERVAL '10 months'),
    ('f3000001-0000-0000-0000-000000000002', 'compensation', 'e1000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'compensation_raise', '{"old_salary": 4500, "new_salary": 5000}'::jsonb, 'Mid-year performance raise approved by HR.', now() - INTERVAL '3 months'),
    ('f3000001-0000-0000-0000-000000000003', 'reviews', 'f1000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'red_health_alert', '{"health": "Red", "score": 2.2}'::jsonb, 'CRITICAL: Account Manager submitted review with RED health. Action plan initiated.', now() - INTERVAL '9 days');
