// Database TypeScript definitions for Ultrix Talent Hub
// Automatically generated from Supabase Postgres schema migrations 00001 & 00002

export type UserRole = 'admin' | 'hr_manager' | 'recruiter' | 'account_manager' | 'viewer' | 'unassigned';
export type PersonStatus = 'candidate' | 'onboarding' | 'active' | 'bench' | 'offboarded' | 'rejected';
export type EnglishLevel = 'B1' | 'B2' | 'C1' | 'C2' | 'Native';
export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
export type OpeningStatus = 'Open' | 'On hold' | 'Filled' | 'Cancelled';
export type RejectionReason = 'skills' | 'english' | 'salary_expectations' | 'client_declined' | 'withdrew' | 'other';
export type InterviewType = 'Screening' | 'Technical interview' | 'Client interview' | 'Offer' | 'Final';
export type RecommendationType = 'Strong yes' | 'Yes' | 'No' | 'Strong no';
export type AssignmentStatus = 'Active' | 'Ended';
export type RateFrequency = 'hourly' | 'monthly';
export type EngagementType = 'contractor' | 'employee';
export type CompReason = 'hire' | 'raise' | 'adjustment' | 'promotion';
export type ContractType = 'contractor_agreement' | 'nda' | 'client_sow' | 'amendment' | 'termination';
export type ContractStatus = 'Draft' | 'Sent' | 'Signed' | 'Expired' | 'Terminated';
export type DocumentType = 'cv' | 'id_copy' | 'certificate' | 'other';
export type ReviewStatus = 'Pending' | 'Submitted' | 'Acknowledged by HR';
export type HealthStatus = 'Green' | 'Yellow' | 'Red';

export interface User {
  id: string;
  auth_id?: string | null;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  country: string;
  timezone: string;
  status: PersonStatus;
  english_level: EnglishLevel;
  seniority: SeniorityLevel;
  skills: string[];
  linkedin_url?: string | null;
  photo_url?: string | null;
  salary_expectation?: number | null;
  salary_currency: string;
  availability_date?: string | null;
  do_not_rehire: boolean;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Client {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  timezone: string;
  account_manager_id?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  openings?: Opening[];
}

export interface Opening {
  id: string;
  title: string;
  client_id: string;
  seniority: SeniorityLevel;
  stack: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  bill_rate_min?: number | null;
  bill_rate_max?: number | null;
  currency: string;
  headcount: number;
  status: OpeningStatus;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  clients?: { id: string; name: string; timezone?: string | null; contact_name?: string | null; contact_email?: string | null } | null;
  users?: { id: string; name: string; email: string } | null;
  applications?: any[];
}

export interface PipelineStage {
  id: string;
  name: string;
  stage_order: number;
  is_terminal: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  person_id: string;
  opening_id: string;
  stage_id: string;
  stage_changed_at: string;
  rejection_reason?: RejectionReason | null;
  rejection_notes?: string | null;
  source?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  person?: Person;
  opening?: Opening;
  stage?: PipelineStage;
}

export interface Interview {
  id: string;
  application_id: string;
  type: InterviewType;
  scheduled_at: string;
  interviewer_ids: string[];
  meeting_url?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Scorecard {
  id: string;
  interview_id: string;
  interviewer_id: string;
  technical: number; // 1-4
  english: number; // 1-4
  communication: number; // 1-4
  culture_fit: number; // 1-4
  recommendation: RecommendationType;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  interviewer?: User;
}

export interface Assignment {
  id: string;
  person_id: string;
  client_id: string;
  role_title: string;
  start_date: string;
  end_date?: string | null;
  hours_per_week: number;
  bill_rate: number; // SENSITIVE
  bill_rate_unit: RateFrequency;
  currency: string;
  account_manager_id?: string | null;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  // Joins
  client?: Client;
  account_manager?: User;
}

export interface CompensationRecord {
  id: string;
  person_id: string;
  amount: number; // SENSITIVE
  currency: string;
  frequency: RateFrequency;
  engagement_type: EngagementType;
  effective_date: string;
  reason: CompReason;
  created_at: string;
  created_by?: string | null;
}

export interface Contract {
  id: string;
  person_id: string;
  client_id?: string | null;
  type: ContractType;
  status: ContractStatus;
  signed_date?: string | null;
  start_date: string;
  end_date?: string | null;
  file_path: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface Document {
  id: string;
  person_id: string;
  type: DocumentType;
  file_path: string;
  file_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface Review {
  id: string;
  person_id: string;
  assignment_id: string;
  period: string; // YYYY-MM
  reviewer_id: string;
  due_date: string;
  status: ReviewStatus;
  rating_delivery?: number | null; // 1-5
  rating_communication?: number | null;
  rating_reliability?: number | null;
  rating_proactivity?: number | null;
  rating_client_satisfaction?: number | null;
  average_score?: number | null;
  client_feedback?: string | null;
  feedback_source?: string | null;
  wins?: string | null;
  concerns?: string | null;
  attendance_issues?: string | null;
  health?: HealthStatus | null;
  submitted_at?: string | null;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  person?: Person;
  reviewer?: User;
  action_items?: ActionItem[];
}

export interface ActionItem {
  id: string;
  review_id: string;
  person_id: string;
  description: string;
  owner_id: string;
  due_date: string;
  done: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  owner?: User;
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  person_id?: string | null;
  actor_id?: string | null;
  action: string;
  diff: Record<string, unknown>;
  note?: string | null;
  created_at: string;
  // Joins
  actor?: User;
}

// Master Workforce View representation
export interface WorkforceMember {
  id: string;
  full_name: string;
  email: string;
  country: string;
  timezone: string;
  status: PersonStatus;
  seniority: SeniorityLevel;
  skills: string[];
  english_level: EnglishLevel;
  photo_url?: string | null;
  availability_date?: string | null;
  created_at: string;

  // Current Assignment
  assignment_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  role_title?: string | null;
  assignment_start_date?: string | null;
  account_manager_id?: string | null;
  account_manager_name?: string | null;
  bill_rate?: number | null; // Restricted
  bill_rate_unit?: RateFrequency | null;

  // Compensation
  current_salary?: number | null; // Restricted
  salary_currency?: string | null;
  salary_frequency?: RateFrequency | null;

  // Margin calculation
  monthly_margin?: number | null; // Restricted to Admin & HR

  // Bench stats
  bench_days: number;

  // Review & Health
  latest_health?: HealthStatus | null;
  latest_score?: number | null;
  latest_review_period?: string | null;

  // Contract expiry
  next_expiry_date?: string | null;
  days_until_expiry?: number | null;
}
