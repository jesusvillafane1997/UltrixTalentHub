import {
  User,
  Person,
  Client,
  Opening,
  PipelineStage,
  Application,
  Interview,
  Scorecard,
  Assignment,
  CompensationRecord,
  Contract,
  Document,
  Review,
  ActionItem,
  ActivityLog,
  WorkforceMember,
} from '@/types/database';

export const MOCK_USERS: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'david@ultrix.digital',
    name: 'David',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'elena.hr@ultrix.digital',
    name: 'Elena Rostova',
    role: 'hr_manager',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'lucas.recruiter@ultrix.digital',
    name: 'Lucas Bennett',
    role: 'recruiter',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'marcos.am@ultrix.digital',
    name: 'Marcos Valenzuela',
    role: 'account_manager',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'sofia.viewer@ultrix.digital',
    name: 'Sofia Chen',
    role: 'viewer',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'alex.new@ultrix.digital',
    name: 'Alex Pending',
    role: 'unassigned',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    created_at: '2026-10-18T00:00:00Z',
    updated_at: '2026-10-18T00:00:00Z',
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1111111-0000-0000-0000-000000000001',
    name: 'Nexus Fintech Corp',
    contact_name: 'Sarah Jenkins',
    contact_email: 'sarah.j@nexusfintech.io',
    timezone: 'America/New_York (EST)',
    account_manager_id: '44444444-4444-4444-4444-444444444444',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c1111111-0000-0000-0000-000000000002',
    name: 'Aura Health Logistics',
    contact_name: 'Dr. Aris Thorne',
    contact_email: 'athorne@aurahealth.co',
    timezone: 'America/Los_Angeles (PST)',
    account_manager_id: '44444444-4444-4444-4444-444444444444',
    active: true,
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'c1111111-0000-0000-0000-000000000003',
    name: 'Starlight Media Inc',
    contact_name: "Claire O'Connor",
    contact_email: 'claire@starlightmedia.uk',
    timezone: 'Europe/London (GMT)',
    account_manager_id: '44444444-4444-4444-4444-444444444444',
    active: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

export const MOCK_PIPELINE_STAGES: PipelineStage[] = [
  { id: '00000001-0000-0000-0000-000000000001', name: 'Applied', stage_order: 1, is_terminal: false, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000001-0000-0000-0000-000000000002', name: 'Screening', stage_order: 2, is_terminal: false, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000001-0000-0000-0000-000000000003', name: 'Technical interview', stage_order: 3, is_terminal: false, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000001-0000-0000-0000-000000000004', name: 'Client interview', stage_order: 4, is_terminal: false, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000001-0000-0000-0000-000000000005', name: 'Offer', stage_order: 5, is_terminal: false, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000001-0000-0000-0000-000000000006', name: 'Hired', stage_order: 6, is_terminal: true, created_at: '2026-01-01T00:00:00Z' },
  { id: '00000001-0000-0000-0000-000000000007', name: 'Rejected', stage_order: 7, is_terminal: true, created_at: '2026-01-01T00:00:00Z' },
];

export const MOCK_OPENINGS: Opening[] = [
  {
    id: 'b1000001-0000-0000-0000-000000000001',
    title: 'Senior Full-Stack React / Node Engineer',
    client_id: 'c1111111-0000-0000-0000-000000000001',
    seniority: 'Senior',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    salary_min: 4500,
    salary_max: 5500,
    bill_rate_min: 8000,
    bill_rate_max: 9500,
    currency: 'USD',
    headcount: 2,
    status: 'Open',
    owner_id: '33333333-3333-3333-3333-333333333333',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'b1000001-0000-0000-0000-000000000002',
    title: 'Staff AI / Python Data Engineer',
    client_id: 'c1111111-0000-0000-0000-000000000002',
    seniority: 'Lead',
    stack: ['Python', 'FastAPI', 'LangChain', 'PostgreSQL', 'Docker'],
    salary_min: 5500,
    salary_max: 7000,
    bill_rate_min: 10000,
    bill_rate_max: 12000,
    currency: 'USD',
    headcount: 1,
    status: 'Open',
    owner_id: '33333333-3333-3333-3333-333333333333',
    created_at: '2026-09-15T00:00:00Z',
    updated_at: '2026-09-15T00:00:00Z',
  },
  {
    id: 'b1000001-0000-0000-0000-000000000003',
    title: 'Senior Cloud DevOps Engineer',
    client_id: 'c1111111-0000-0000-0000-000000000003',
    seniority: 'Senior',
    stack: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions'],
    salary_min: 5000,
    salary_max: 6200,
    bill_rate_min: 8500,
    bill_rate_max: 10500,
    currency: 'USD',
    headcount: 1,
    status: 'On hold',
    owner_id: '33333333-3333-3333-3333-333333333333',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  },
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'ap-001',
    person_id: 'a1000001-0000-0000-0000-000000000005', // Ignacio Silva
    opening_id: 'b1000001-0000-0000-0000-000000000001',
    stage_id: '00000001-0000-0000-0000-000000000003', // Technical interview
    stage_changed_at: '2026-10-11T00:00:00Z',
    source: 'LinkedIn Sourcing',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    id: 'ap-002',
    person_id: 'a1000001-0000-0000-0000-000000000004', // Valentina Gomez
    opening_id: 'b1000001-0000-0000-0000-000000000002',
    stage_id: '00000001-0000-0000-0000-000000000005', // Offer stage
    stage_changed_at: '2026-10-17T00:00:00Z',
    source: 'Direct Inbound Application',
    created_at: '2026-10-05T00:00:00Z',
    updated_at: '2026-10-17T00:00:00Z',
  },
  {
    id: 'ap-003',
    person_id: 'a1000001-0000-0000-0000-000000000006', // Lucia Fernandez
    opening_id: 'b1000001-0000-0000-0000-000000000001',
    stage_id: '00000001-0000-0000-0000-000000000007', // Rejected
    stage_changed_at: '2026-09-19T00:00:00Z',
    source: 'Employee Referral',
    rejection_reason: 'skills',
    rejection_notes: 'Missing advanced GraphQL/distributed systems experience.',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-19T00:00:00Z',
  },
];

export const MOCK_PEOPLE: Person[] = [
  {
    id: 'a1000001-0000-0000-0000-000000000001',
    full_name: 'Mateo Rossi',
    email: 'mateo.rossi@devlatam.io',
    phone: '+54 9 11 4589 1234',
    country: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires (ART)',
    status: 'active',
    english_level: 'C1',
    seniority: 'Senior',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'PostgreSQL'],
    linkedin_url: 'https://linkedin.com/in/mateorossi-fake',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    salary_expectation: 5000,
    salary_currency: 'USD',
    availability_date: '2026-01-15',
    do_not_rehire: false,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z',
  },
  {
    id: 'a1000001-0000-0000-0000-000000000002',
    full_name: 'Camila Alvarez',
    email: 'camila.alvarez@codeflow.co',
    phone: '+57 310 987 6543',
    country: 'Colombia',
    timezone: 'America/Bogota (COT)',
    status: 'active',
    english_level: 'B2',
    seniority: 'Senior',
    skills: ['Python', 'Django', 'FastAPI', 'Docker', 'AWS'],
    linkedin_url: 'https://linkedin.com/in/camilaalvarez-fake',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    salary_expectation: 4800,
    salary_currency: 'USD',
    availability_date: '2026-03-01',
    do_not_rehire: false,
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
  },
  {
    id: 'a1000001-0000-0000-0000-000000000003',
    full_name: 'Santiago Diaz',
    email: 'santiago.diaz@infraops.net',
    phone: '+56 9 8765 4321',
    country: 'Chile',
    timezone: 'America/Santiago (CLT)',
    status: 'bench',
    english_level: 'C2',
    seniority: 'Lead',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'CI/CD'],
    linkedin_url: 'https://linkedin.com/in/santiagodiaz-fake',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    salary_expectation: 6000,
    salary_currency: 'USD',
    availability_date: '2026-10-01',
    do_not_rehire: false,
    created_at: '2025-05-15T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'a1000001-0000-0000-0000-000000000004',
    full_name: 'Valentina Gomez',
    email: 'valen.gomez@techcraft.dev',
    phone: '+55 11 98888 7777',
    country: 'Brazil',
    timezone: 'America/Sao_Paulo (BRT)',
    status: 'onboarding',
    english_level: 'C1',
    seniority: 'Mid',
    skills: ['React Native', 'TypeScript', 'Redux', 'GraphQL'],
    linkedin_url: 'https://linkedin.com/in/valentinagomez-fake',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    salary_expectation: 4000,
    salary_currency: 'USD',
    availability_date: '2026-11-01',
    do_not_rehire: false,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-18T00:00:00Z',
  },
  {
    id: 'a1000001-0000-0000-0000-000000000005',
    full_name: 'Ignacio Silva',
    email: 'ignacio.silva@coderlatam.io',
    phone: '+54 9 351 123 4567',
    country: 'Argentina',
    timezone: 'America/Argentina/Cordoba',
    status: 'candidate',
    english_level: 'B2',
    seniority: 'Senior',
    skills: ['React', 'Next.js', 'Tailwind', 'GraphQL'],
    linkedin_url: 'https://linkedin.com/in/ignaciosilva-fake',
    photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200',
    salary_expectation: 5000,
    salary_currency: 'USD',
    availability_date: '2026-11-15',
    do_not_rehire: false,
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-11T00:00:00Z',
  },
  {
    id: 'a1000001-0000-0000-0000-000000000006',
    full_name: 'Lucia Fernandez',
    email: 'lucia.f@latamstack.org',
    phone: '+598 99 123 456',
    country: 'Uruguay',
    timezone: 'America/Montevideo (UYT)',
    status: 'rejected',
    english_level: 'B1',
    seniority: 'Mid',
    skills: ['Python', 'Django', 'PostgreSQL'],
    linkedin_url: 'https://linkedin.com/in/luciafernandez-fake',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    salary_expectation: 3500,
    salary_currency: 'USD',
    availability_date: '2026-08-01',
    do_not_rehire: false,
    created_at: '2026-07-20T00:00:00Z',
    updated_at: '2026-08-05T00:00:00Z',
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'd2000001-0000-0000-0000-000000000001',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    client_id: 'c1111111-0000-0000-0000-000000000001',
    role_title: 'Lead React Engineer',
    start_date: '2026-01-15',
    hours_per_week: 40,
    bill_rate: 9000,
    bill_rate_unit: 'monthly',
    currency: 'USD',
    account_manager_id: '44444444-4444-4444-4444-444444444444',
    status: 'Active',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'd2000001-0000-0000-0000-000000000002',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    client_id: 'c1111111-0000-0000-0000-000000000002',
    role_title: 'Senior Backend Engineer',
    start_date: '2026-03-01',
    hours_per_week: 40,
    bill_rate: 8500,
    bill_rate_unit: 'monthly',
    currency: 'USD',
    account_manager_id: '44444444-4444-4444-4444-444444444444',
    status: 'Active',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'd2000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000003',
    client_id: 'c1111111-0000-0000-0000-000000000003',
    role_title: 'Staff DevOps Lead',
    start_date: '2025-06-01',
    end_date: '2026-09-27',
    hours_per_week: 40,
    bill_rate: 10000,
    bill_rate_unit: 'monthly',
    currency: 'USD',
    account_manager_id: '44444444-4444-4444-4444-444444444444',
    status: 'Ended',
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2026-09-27T00:00:00Z',
  },
];

export const MOCK_COMPENSATION: CompensationRecord[] = [
  {
    id: 'e1000001-0000-0000-0000-000000000001',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    amount: 4500,
    currency: 'USD',
    frequency: 'monthly',
    engagement_type: 'contractor',
    effective_date: '2026-01-15',
    reason: 'hire',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'e1000001-0000-0000-0000-000000000002',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    amount: 5000,
    currency: 'USD',
    frequency: 'monthly',
    engagement_type: 'contractor',
    effective_date: '2026-07-01',
    reason: 'raise',
    created_at: '2026-06-25T00:00:00Z',
  },
  {
    id: 'e1000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    amount: 4800,
    currency: 'USD',
    frequency: 'monthly',
    engagement_type: 'contractor',
    effective_date: '2026-03-01',
    reason: 'hire',
    created_at: '2026-02-28T00:00:00Z',
  },
  {
    id: 'e1000001-0000-0000-0000-000000000004',
    person_id: 'a1000001-0000-0000-0000-000000000003',
    amount: 6000,
    currency: 'USD',
    frequency: 'monthly',
    engagement_type: 'contractor',
    effective_date: '2025-06-01',
    reason: 'hire',
    created_at: '2025-05-30T00:00:00Z',
  },
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c2000001-0000-0000-0000-000000000001',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    type: 'contractor_agreement',
    status: 'Signed',
    signed_date: '2026-01-10',
    start_date: '2026-01-15',
    end_date: '2027-01-15',
    file_path: 'contracts/mateo_rossi_contractor_agmt.pdf',
    file_name: 'mateo_rossi_contractor_agmt.pdf',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'c2000001-0000-0000-0000-000000000002',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    type: 'nda',
    status: 'Signed',
    signed_date: '2026-01-10',
    start_date: '2026-01-15',
    file_path: 'contracts/mateo_rossi_nda.pdf',
    file_name: 'mateo_rossi_nda.pdf',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'c2000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    client_id: 'c1111111-0000-0000-0000-000000000001',
    type: 'client_sow',
    status: 'Signed',
    signed_date: '2026-01-12',
    start_date: '2026-01-15',
    end_date: '2027-01-15',
    file_path: 'contracts/nexus_mateo_sow.pdf',
    file_name: 'nexus_mateo_sow.pdf',
    created_at: '2026-01-12T00:00:00Z',
    updated_at: '2026-01-12T00:00:00Z',
  },
  {
    id: 'c2000001-0000-0000-0000-000000000004',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    type: 'contractor_agreement',
    status: 'Signed',
    signed_date: '2026-03-01',
    start_date: '2026-03-01',
    end_date: '2026-11-08', // Expiring in 20 days -> triggers 30-day alert!
    file_path: 'contracts/camila_alvarez_contractor_agmt.pdf',
    file_name: 'camila_alvarez_contractor_agmt.pdf',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'c2000001-0000-0000-0000-000000000005',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    type: 'nda',
    status: 'Signed',
    signed_date: '2026-03-01',
    start_date: '2026-03-01',
    file_path: 'contracts/camila_alvarez_nda.pdf',
    file_name: 'camila_alvarez_nda.pdf',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'c2000001-0000-0000-0000-000000000008',
    person_id: 'a1000001-0000-0000-0000-000000000004',
    type: 'contractor_agreement',
    status: 'Sent',
    start_date: '2026-11-01',
    file_path: 'contracts/valentina_draft_agmt.pdf',
    file_name: 'valentina_draft_agmt.pdf',
    created_at: '2026-10-18T00:00:00Z',
    updated_at: '2026-10-18T00:00:00Z',
  },
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'dc000001-0000-0000-0000-000000000001',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    type: 'cv',
    file_path: 'cvs/mateo_rossi_cv_2026.pdf',
    file_name: 'mateo_rossi_cv_2026.pdf',
    file_size: 384920,
    mime_type: 'application/pdf',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'dc000001-0000-0000-0000-000000000002',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    type: 'id_copy',
    file_path: 'ids/mateo_rossi_dni.pdf',
    file_name: 'mateo_rossi_dni.pdf',
    file_size: 1248000,
    mime_type: 'application/pdf',
    created_at: '2026-01-08T00:00:00Z',
  },
  {
    id: 'dc000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    type: 'cv',
    file_path: 'cvs/camila_alvarez_cv.pdf',
    file_name: 'camila_alvarez_cv.pdf',
    file_size: 295000,
    mime_type: 'application/pdf',
    created_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'dc000001-0000-0000-0000-000000000004',
    person_id: 'a1000001-0000-0000-0000-000000000005',
    type: 'cv',
    file_path: 'cvs/ignacio_silva_resume.pdf',
    file_name: 'ignacio_silva_resume.pdf',
    file_size: 412000,
    mime_type: 'application/pdf',
    created_at: '2026-10-10T00:00:00Z',
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'f1000001-0000-0000-0000-000000000001',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    assignment_id: 'd2000001-0000-0000-0000-000000000001',
    period: '2026-10',
    reviewer_id: '44444444-4444-4444-4444-444444444444',
    due_date: '2026-10-10',
    status: 'Acknowledged by HR',
    rating_delivery: 5,
    rating_communication: 5,
    rating_reliability: 5,
    rating_proactivity: 4,
    rating_client_satisfaction: 5,
    average_score: 4.8,
    client_feedback: 'Sarah Jenkins (VP Eng): "Mateo is one of our best external engineers. Shipped checkout migration 2 weeks ahead of schedule."',
    feedback_source: 'Monthly sync call with Sarah Jenkins',
    wins: 'Delivered the checkout refactor ahead of deadline; praised in company all-hands.',
    concerns: 'None.',
    attendance_issues: 'No issues, 100% on-time attendance.',
    health: 'Green',
    submitted_at: '2026-10-08T14:30:00Z',
    acknowledged_by: '22222222-2222-2222-2222-222222222222',
    acknowledged_at: '2026-10-09T10:15:00Z',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-09T10:15:00Z',
  },
  {
    id: 'f1000001-0000-0000-0000-000000000002',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    assignment_id: 'd2000001-0000-0000-0000-000000000001',
    period: '2026-09',
    reviewer_id: '44444444-4444-4444-4444-444444444444',
    due_date: '2026-09-10',
    status: 'Acknowledged by HR',
    rating_delivery: 4,
    rating_communication: 4,
    rating_reliability: 5,
    rating_proactivity: 4,
    rating_client_satisfaction: 4,
    average_score: 4.2,
    client_feedback: 'Solid sprint outputs.',
    feedback_source: 'Email report',
    wins: 'Maintained 99.9% uptime during payments release.',
    concerns: 'None.',
    attendance_issues: 'None.',
    health: 'Green',
    submitted_at: '2026-09-08T16:00:00Z',
    acknowledged_by: '22222222-2222-2222-2222-222222222222',
    acknowledged_at: '2026-09-09T11:00:00Z',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-09T11:00:00Z',
  },
  {
    id: 'f1000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    assignment_id: 'd2000001-0000-0000-0000-000000000002',
    period: '2026-10',
    reviewer_id: '44444444-4444-4444-4444-444444444444',
    due_date: '2026-10-10',
    status: 'Submitted',
    rating_delivery: 2,
    rating_communication: 2,
    rating_reliability: 3,
    rating_proactivity: 2,
    rating_client_satisfaction: 2,
    average_score: 2.2,
    client_feedback: 'Dr. Aris Thorne: "Camila missed two critical sprint deliverables and had communication blackouts during standup without notice."',
    feedback_source: 'Slack escalation from Dr. Thorne',
    wins: 'Helped fix a critical database query lock on Tuesday.',
    concerns: 'Missed sprint commitments and slow response time on Slack.',
    attendance_issues: 'Unannounced absence during client demo on Oct 4.',
    health: 'Red',
    submitted_at: '2026-10-10T18:20:00Z',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-10T18:20:00Z',
  },
];

export const MOCK_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'f2000001-0000-0000-0000-000000000001',
    review_id: 'f1000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    description: 'Schedule 1-on-1 alignment call with Camila regarding communication SLAs',
    owner_id: '22222222-2222-2222-2222-222222222222',
    due_date: '2026-10-21',
    done: false,
    created_at: '2026-10-10T18:25:00Z',
    updated_at: '2026-10-10T18:25:00Z',
  },
  {
    id: 'f2000001-0000-0000-0000-000000000002',
    review_id: 'f1000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    description: 'Establish daily Slack check-in protocol with Account Manager Marcos',
    owner_id: '44444444-4444-4444-4444-444444444444',
    due_date: '2026-10-22',
    done: false,
    created_at: '2026-10-10T18:25:00Z',
    updated_at: '2026-10-10T18:25:00Z',
  },
];

export const MOCK_ACTIVITY_LOG: ActivityLog[] = [
  {
    id: 'f3000001-0000-0000-0000-000000000003',
    entity_type: 'reviews',
    entity_id: 'f1000001-0000-0000-0000-000000000003',
    person_id: 'a1000001-0000-0000-0000-000000000002',
    actor_id: '44444444-4444-4444-4444-444444444444',
    action: 'red_health_alert',
    diff: { health: 'Red', score: 2.2 },
    note: 'CRITICAL: Account Manager submitted review with RED health. Action plan initiated.',
    created_at: '2026-10-10T18:20:00Z',
  },
  {
    id: 'f3000001-0000-0000-0000-000000000002',
    entity_type: 'compensation',
    entity_id: 'e1000001-0000-0000-0000-000000000002',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    actor_id: '22222222-2222-2222-2222-222222222222',
    action: 'compensation_raise',
    diff: { old_salary: 4500, new_salary: 5000 },
    note: 'Mid-year performance raise approved by HR.',
    created_at: '2026-06-25T11:00:00Z',
  },
  {
    id: 'f3000001-0000-0000-0000-000000000001',
    entity_type: 'people',
    entity_id: 'a1000001-0000-0000-0000-000000000001',
    person_id: 'a1000001-0000-0000-0000-000000000001',
    actor_id: '11111111-1111-1111-1111-111111111111',
    action: 'status_change',
    diff: { before: 'onboarding', after: 'active' },
    note: 'Active Gate verified: Signed contractor agreement and NDA confirmed on file.',
    created_at: '2026-01-15T09:00:00Z',
  },
];

// Helper to assemble workforce master view rows
export function getWorkforceMembers(): WorkforceMember[] {
  return MOCK_PEOPLE.map((p) => {
    const activeAssignment = MOCK_ASSIGNMENTS.find(
      (a) => a.person_id === p.id && a.status === 'Active'
    );
    const client = activeAssignment
      ? MOCK_CLIENTS.find((c) => c.id === activeAssignment.client_id)
      : undefined;
    const am = activeAssignment
      ? MOCK_USERS.find((u) => u.id === activeAssignment.account_manager_id)
      : undefined;

    const comps = MOCK_COMPENSATION.filter((c) => c.person_id === p.id).sort(
      (a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
    );
    const currentComp = comps[0];

    const reviews = MOCK_REVIEWS.filter((r) => r.person_id === p.id).sort(
      (a, b) => b.period.localeCompare(a.period)
    );
    const latestReview = reviews[0];

    const signedContracts = MOCK_CONTRACTS.filter(
      (k) => k.person_id === p.id && k.status === 'Signed' && k.end_date
    ).sort((a, b) => (a.end_date! > b.end_date! ? 1 : -1));
    const nextExpiringContract = signedContracts[0];

    let monthlyMargin: number | null = null;
    if (activeAssignment && currentComp) {
      const billMonthly =
        activeAssignment.bill_rate_unit === 'hourly'
          ? activeAssignment.bill_rate * 160
          : activeAssignment.bill_rate;
      const salaryMonthly =
        currentComp.frequency === 'hourly'
          ? currentComp.amount * 160
          : currentComp.amount;
      monthlyMargin = billMonthly - salaryMonthly;
    }

    const SYSTEM_REFERENCE_DATE = new Date('2026-10-19T12:00:00Z').getTime();

    let benchDays = 0;
    if (p.status === 'bench') {
      const pastAssignments = MOCK_ASSIGNMENTS.filter((a) => a.person_id === p.id && a.end_date);
      if (pastAssignments.length > 0) {
        const lastEnd = new Date(pastAssignments[0].end_date!).getTime();
        benchDays = Math.max(0, Math.floor((SYSTEM_REFERENCE_DATE - lastEnd) / (1000 * 60 * 60 * 24)));
      } else {
        benchDays = Math.floor((SYSTEM_REFERENCE_DATE - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    let daysUntilExpiry: number | null = null;
    if (nextExpiringContract?.end_date) {
      const diffMs = new Date(nextExpiringContract.end_date).getTime() - SYSTEM_REFERENCE_DATE;
      daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      country: p.country,
      timezone: p.timezone,
      status: p.status,
      seniority: p.seniority,
      skills: p.skills,
      english_level: p.english_level,
      photo_url: p.photo_url,
      availability_date: p.availability_date,
      created_at: p.created_at,

      assignment_id: activeAssignment?.id,
      client_id: activeAssignment?.client_id,
      client_name: client?.name,
      role_title: activeAssignment?.role_title,
      assignment_start_date: activeAssignment?.start_date,
      account_manager_id: activeAssignment?.account_manager_id,
      account_manager_name: am?.name,
      bill_rate: activeAssignment?.bill_rate,
      bill_rate_unit: activeAssignment?.bill_rate_unit,

      current_salary: currentComp?.amount ?? p.salary_expectation ?? undefined,
      salary_currency: currentComp?.currency || p.salary_currency || 'USD',
      salary_frequency: currentComp?.frequency || 'monthly',

      monthly_margin: monthlyMargin,
      bench_days: p.status === 'bench' ? benchDays : 0,

      latest_health: latestReview?.health,
      latest_score: latestReview?.average_score,
      latest_review_period: latestReview?.period,

      next_expiry_date: nextExpiringContract?.end_date,
      days_until_expiry: daysUntilExpiry,
    };
  });
}

// In-memory data store mutations for immediate reactive updates
export function addMockCandidate(params: {
  person: Person;
  application?: Application;
  document?: Document;
  activityLog?: ActivityLog;
}) {
  const existingIdx = MOCK_PEOPLE.findIndex(
    (p) => p.id === params.person.id || (p.email && p.email.toLowerCase() === params.person.email.toLowerCase())
  );
  if (existingIdx >= 0) {
    MOCK_PEOPLE[existingIdx] = params.person;
  } else {
    MOCK_PEOPLE.unshift(params.person);
  }

  if (params.application) {
    const appIdx = MOCK_APPLICATIONS.findIndex((a) => a.id === params.application!.id);
    if (appIdx >= 0) {
      MOCK_APPLICATIONS[appIdx] = params.application;
    } else {
      MOCK_APPLICATIONS.unshift(params.application);
    }
  }
  if (params.document) {
    const docIdx = MOCK_DOCUMENTS.findIndex((d) => d.id === params.document!.id);
    if (docIdx >= 0) {
      MOCK_DOCUMENTS[docIdx] = params.document;
    } else {
      MOCK_DOCUMENTS.unshift(params.document);
    }
  }
  if (params.activityLog) {
    MOCK_ACTIVITY_LOG.unshift(params.activityLog);
  }

  // If in browser runtime, notify all listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ultrix-talent-updated', {
        detail: { person: params.person, application: params.application },
      })
    );
  }

  return {
    person: params.person,
    application: params.application,
    document: params.document,
  };
}

export function addMockDocument(doc: Document, activity?: ActivityLog) {
  MOCK_DOCUMENTS.unshift(doc);
  if (activity) {
    MOCK_ACTIVITY_LOG.unshift(activity);
  }
  return doc;
}

