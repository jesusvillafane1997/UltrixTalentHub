import { createClient } from '@/lib/supabase/client';
import {
  Person,
  Opening,
  Client,
  PipelineStage,
  Application,
  Contract,
  Document,
  Review,
  CompensationRecord,
  Assignment,
  ActionItem,
  ActivityLog,
  WorkforceMember,
  User,
} from '@/types/database';

export const DataService = {
  // 1. Workforce Master (Dashboard & Main workforce table)
  async getWorkforceMembers(): Promise<WorkforceMember[]> {
    try {
      const supabase = createClient();
      // Try derived master view first
      const { data, error } = await supabase
        .from('view_workforce_master')
        .select('*');

      if (!error && data) {
        return data as WorkforceMember[];
      }

      // Fallback: Query people table directly if view is not accessible
      const { data: peopleData, error: peopleErr } = await supabase
        .from('people')
        .select('*')
        .order('created_at', { ascending: false });

      if (peopleErr || !peopleData) {
        return [];
      }

      // Return people converted to basic workforce members
      return (peopleData as Person[]).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        country: p.country,
        timezone: p.timezone,
        status: p.status,
        seniority: p.seniority,
        skills: p.skills || [],
        english_level: p.english_level,
        photo_url: p.photo_url || null,
        availability_date: p.availability_date || null,
        created_at: p.created_at,
        assignment_id: null,
        client_id: null,
        client_name: null,
        role_title: null,
        assignment_start_date: null,
        account_manager_id: null,
        account_manager_name: null,
        bill_rate: null,
        bill_rate_unit: null,
        current_salary: p.salary_expectation || null,
        salary_currency: p.salary_currency || 'USD',
        salary_frequency: 'monthly',
        monthly_margin: null,
        bench_days: p.status === 'bench' ? 14 : 0,
        latest_health: null,
        latest_score: null,
        latest_review_period: null,
        next_expiry_date: null,
        days_until_expiry: null,
      }));
    } catch (err) {
      console.warn('getWorkforceMembers error:', err);
      return [];
    }
  },

  // 2. People Directory
  async getPeople(statusFilter?: string): Promise<Person[]> {
    try {
      const supabase = createClient();
      let query = supabase.from('people').select('*').order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'workers') {
          query = query.in('status', ['active', 'onboarding']);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as Person[];
    } catch {
      return [];
    }
  },

  // 3. Person Full Profile Bundle
  async getPersonProfile(personId: string) {
    try {
      const supabase = createClient();

      const [
        personRes,
        docsRes,
        contractsRes,
        assignmentsRes,
        compRes,
        reviewsRes,
        logsRes,
        appsRes,
      ] = await Promise.all([
        supabase.from('people').select('*').eq('id', personId).maybeSingle(),
        supabase.from('documents').select('*').eq('person_id', personId).order('created_at', { ascending: false }),
        supabase.from('contracts').select('*, clients(name)').eq('person_id', personId).order('created_at', { ascending: false }),
        supabase.from('assignments').select('*, clients(name), account_manager:account_manager_id(id, name, email)').eq('person_id', personId).order('start_date', { ascending: false }),
        supabase.from('compensation_records').select('*').eq('person_id', personId).order('effective_date', { ascending: false }),
        supabase.from('reviews').select('*, users(name)').eq('person_id', personId).order('period', { ascending: false }),
        supabase.from('activity_log').select('*, users(name)').eq('person_id', personId).order('created_at', { ascending: false }),
        supabase.from('applications').select('*, openings(id, title, client_id, clients(name)), pipeline_stages(id, name, stage_order)').eq('person_id', personId),
      ]);

      return {
        person: (personRes.data as Person) || null,
        documents: (docsRes.data as Document[]) || [],
        contracts: (contractsRes.data as Contract[]) || [],
        assignments: (assignmentsRes.data as Assignment[]) || [],
        compensation: (compRes.data as CompensationRecord[]) || [],
        reviews: (reviewsRes.data as Review[]) || [],
        activityLog: (logsRes.data as ActivityLog[]) || [],
        applications: (appsRes.data as any[]) || [],
      };
    } catch (err) {
      console.warn('getPersonProfile error:', err);
      return {
        person: null,
        documents: [],
        contracts: [],
        assignments: [],
        compensation: [],
        reviews: [],
        activityLog: [],
        applications: [],
      };
    }
  },

  // 4. Openings & ATS
  async getOpenings(): Promise<Opening[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('openings')
        .select('*, clients(id, name, timezone, contact_name, contact_email), users:owner_id(id, name, email), applications(id, stage_id, pipeline_stages(name))')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('getOpenings DB error:', error.message);
        return [];
      }
      return (data as Opening[]) || [];
    } catch (err: any) {
      console.warn('getOpenings error:', err);
      return [];
    }
  },

  async getOpeningById(id: string): Promise<Opening | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('openings')
        .select('*, clients(id, name, timezone, contact_name, contact_email), users:owner_id(id, name, email)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.warn('getOpeningById DB error:', error.message);
        return null;
      }
      return (data as Opening) || null;
    } catch (err: any) {
      console.warn('getOpeningById error:', err);
      return null;
    }
  },

  async getPipelineStages(): Promise<PipelineStage[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('stage_order', { ascending: true });

      if (error || !data) return [];
      return data as PipelineStage[];
    } catch {
      return [];
    }
  },

  async getApplicationsForOpening(openingId: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('applications')
        .select('*, people(*), interviews(*, scorecards(*))')
        .eq('opening_id', openingId);

      if (error) {
        console.warn('getApplicationsForOpening DB error:', error.message);
        return [];
      }
      return data || [];
    } catch (err: any) {
      console.warn('getApplicationsForOpening error:', err);
      return [];
    }
  },

  async getAvailableCandidatesForOpening(openingId: string): Promise<Person[]> {
    try {
      const supabase = createClient();
      const { data: existingApps } = await supabase
        .from('applications')
        .select('person_id')
        .eq('opening_id', openingId);

      const existingPersonIds = new Set((existingApps || []).map((a: any) => a.person_id).filter(Boolean));

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('do_not_rehire', false)
        .is('archived_at', null)
        .order('full_name', { ascending: true });

      if (error || !data) return [];
      return (data as Person[]).filter((p) => !existingPersonIds.has(p.id) && (p as any).status !== 'archived');
    } catch {
      return [];
    }
  },

  async updateApplicationStage(applicationId: string, stageId: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('applications')
        .update({ stage_id: stageId, stage_changed_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // 5. Clients
  async getClients(): Promise<Client[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*, users(id, name, email), assignments(*, people(id, full_name, salary_expectation)), openings(*)')
        .order('name');

      if (error || !data) return [];
      return data as Client[];
    } catch {
      return [];
    }
  },

  // 6. Reviews
  async getReviews(): Promise<Review[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reviews')
        .select('*, people(full_name, photo_url, status), assignments(role_title, client_id, clients(name)), users(name)')
        .order('period', { ascending: false });

      if (error || !data) return [];
      return data as Review[];
    } catch {
      return [];
    }
  },

  async getActionItems(): Promise<ActionItem[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('action_items')
        .select('*, people(full_name), users(name)')
        .order('due_date', { ascending: true });

      if (error || !data) return [];
      return data as ActionItem[];
    } catch {
      return [];
    }
  },

  // 7. Activity Log
  async getActivityLog(): Promise<ActivityLog[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, users(name), people(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];
      return data as ActivityLog[];
    } catch {
      return [];
    }
  },

  // 8. Staff Users
  async getUsers(): Promise<User[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error || !data) return [];
      return data as User[];
    } catch {
      return [];
    }
  },
};
