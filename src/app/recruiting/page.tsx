'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { KanbanBoard, KanbanCandidateItem } from '@/components/recruiting/kanban-board';
import { AddCandidateModal } from '@/components/recruiting/add-candidate-modal';
import { CreateOpeningDialog } from '@/components/openings/create-opening-dialog';
import { RejectionReason, Person, Application, Document, Opening, PipelineStage } from '@/types/database';
import {
  Briefcase,
  Building,
  Plus,
  Search,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  Columns3,
  ListFilter,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function RecruitingPage() {
  const { currentUser, isAdminOptIn } = useAuth();
  const canManage = Permissions.canManageOpenings(currentUser.role);
  const canSeeComp = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);
  const canAdd = Permissions.canAddCandidate(currentUser.role);

  const [activeTab, setActiveTab] = useState<'kanban' | 'openings' | 'talent-pool'>('kanban');
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>('');
  const [candidates, setCandidates] = useState<KanbanCandidateItem[]>([]);
  const [talentPool, setTalentPool] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [talentSearch, setTalentSearch] = useState('');
  const [englishFilter, setEnglishFilter] = useState('all');
  const [seniorityFilter, setSeniorityFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Load openings
  async function loadOpenings() {
    const data = await DataService.getOpenings();
    setOpenings(data);
    if (data.length > 0 && !selectedOpeningId) {
      setSelectedOpeningId(data[0].id);
    }
    return data;
  }

  // 2. Load applications for selected opening
  async function loadApplications(opId: string) {
    if (!opId) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    try {
      const apps = await DataService.getApplicationsForOpening(opId);
      const items: KanbanCandidateItem[] = apps
        .filter((app: any) => app.people)
        .map((app: any) => {
          const daysInStage = app.stage_changed_at
            ? Math.max(0, Math.floor((Date.now() - new Date(app.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          let scoreAvg: number | undefined = undefined;
          if (app.scorecards && app.scorecards.length > 0) {
            const sc = app.scorecards[0];
            scoreAvg = (sc.technical + sc.english + sc.communication + sc.culture_fit) / 4;
          }

          return {
            applicationId: app.id,
            personId: app.people.id,
            name: app.people.full_name,
            photoUrl: app.people.photo_url || null,
            seniority: app.people.seniority,
            englishLevel: app.people.english_level,
            skills: app.people.skills || [],
            stageId: app.stage_id,
            daysInStage,
            isStuck: daysInStage > 7,
            scorecardAvg: scoreAvg,
          };
        });

      setCandidates(items);
    } finally {
      setLoading(false);
    }
  }

  // 3. Load general candidates talent pool
  async function loadTalentPool() {
    const pool = await DataService.getPeople('candidate');
    setTalentPool(pool);
  }

  useEffect(() => {
    DataService.getPipelineStages().then(setStages).catch(() => {});
    loadOpenings().then((ops) => {
      if (ops.length > 0) {
        loadApplications(ops[0].id);
      } else {
        setLoading(false);
      }
    });
    loadTalentPool();

    const handleTalentSync = () => {
      if (selectedOpeningId) {
        loadApplications(selectedOpeningId);
      }
      loadTalentPool();
    };

    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, []);

  useEffect(() => {
    if (selectedOpeningId) {
      loadApplications(selectedOpeningId);
    }
  }, [selectedOpeningId]);

  const selectedOpening = openings.find((o) => o.id === selectedOpeningId) || openings[0] || null;
  const openingClientName = (selectedOpening as any)?.clients?.name || 'Assigned Client';

  const handleCandidateHire = async (personId: string) => {
    try {
      const supabase = createClient();
      await supabase.from('people').update({ status: 'onboarding' }).eq('id', personId);
      loadApplications(selectedOpeningId);
      loadTalentPool();
    } catch {
      // Ignored
    }
  };

  const handleCandidateReject = async (personId: string, reason: RejectionReason, notes: string) => {
    try {
      const supabase = createClient();
      await supabase.from('people').update({ status: 'rejected' }).eq('id', personId);
      await supabase.from('applications').update({
        rejection_reason: reason,
        rejection_notes: notes,
      }).eq('person_id', personId).eq('opening_id', selectedOpeningId);

      loadApplications(selectedOpeningId);
      loadTalentPool();
    } catch {
      // Ignored
    }
  };

  const handleAddPersonToOpening = async (person: Person) => {
    if (candidates.some((c) => c.personId === person.id)) {
      alert(`${person.full_name} is already active in this opening.`);
      return;
    }

    try {
      const supabase = createClient();
      const stages = await DataService.getPipelineStages();
      const appliedStageId = stages[0]?.id || '00000001-0000-0000-0000-000000000001';

      await supabase.from('applications').insert([
        {
          id: crypto.randomUUID(),
          person_id: person.id,
          opening_id: selectedOpeningId,
          stage_id: appliedStageId,
          source: 'Talent Pool Sourced',
          created_at: new Date().toISOString(),
          created_by: currentUser.id,
        },
      ]);

      loadApplications(selectedOpeningId);
      setActiveTab('kanban');
    } catch (err: any) {
      alert('Error adding candidate: ' + err.message);
    }
  };

  const handleCandidateCreated = (
    newPerson: Person,
    application?: Application,
    doc?: Document
  ) => {
    if (selectedOpeningId) {
      loadApplications(selectedOpeningId);
    }
    loadTalentPool();
  };

  // Filter talent pool
  const filteredTalent = talentPool.filter((p) => {
    if (talentSearch.trim()) {
      const q = talentSearch.toLowerCase();
      const matchesName = p.full_name.toLowerCase().includes(q);
      const matchesSkills = p.skills && p.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchesName && !matchesSkills) return false;
    }
    if (englishFilter !== 'all' && p.english_level !== englishFilter) return false;
    if (seniorityFilter !== 'all' && p.seniority !== seniorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.1]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Recruiting &amp; ATS Pipeline
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              LIVE SUPABASE ATS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive Kanban candidate staging, stuck alerts (&gt;7d), scorecards, and hiring gate transitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 px-3 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 flex items-center gap-1.5 transition-all border border-white/10 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ New Opening</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Candidate</span>
            </button>
          )}

          {/* Tab Selector */}
          <div className="flex p-1 bg-[#141822] rounded-xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('kanban')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'kanban'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-xs border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setActiveTab('openings')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'openings'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-xs border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Job Openings ({openings.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('talent-pool')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                activeTab === 'talent-pool'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-xs border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Talent Pool ({talentPool.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Kanban Board View */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          {openings.length === 0 ? (
            <div className="p-16 metallic-surface rounded-2xl border border-white/10 text-center space-y-4">
              <Briefcase className="w-10 h-10 text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">No Job Openings in Database</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Create a client opening to launch the interactive candidate Kanban pipeline.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Opening Selector Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedOpeningId}
                        onChange={(e) => setSelectedOpeningId(e.target.value)}
                        className="bg-[#131620] hover:bg-[#1c2230] text-slate-100 font-bold text-sm border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                      >
                        {openings.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.title} &bull; {(o as any).clients?.name || 'Client'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedOpening && (
                      <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-2">
                        <span>Client: {openingClientName}</span>
                        <span>&bull;</span>
                        <span>Seniority: {selectedOpening.seniority}</span>
                        <span>&bull;</span>
                        <span className="text-teal-300">
                          Budget: {formatCurrency(selectedOpening.salary_min || 0)} - {formatCurrency(selectedOpening.salary_max || 0)}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-xl bg-[#131620] border border-white/10 text-slate-300">
                    Pipeline Candidates:{' '}
                    <strong className="text-cyan-300">{candidates.length}</strong>
                  </div>
                  {selectedOpening && (
                    <Link
                      href={`/openings/${selectedOpening.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1 transition-all"
                    >
                      <span>Full Opening Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Live Kanban Board Component */}
              {selectedOpening && (
                <KanbanBoard
                  opening={selectedOpening}
                  stages={stages}
                  initialCandidates={candidates}
                  onCandidateHire={handleCandidateHire}
                  onCandidateReject={handleCandidateReject}
                  onOpenAddCandidate={() => setIsAddModalOpen(true)}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Job Openings Roster */}
      {activeTab === 'openings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {openings.map((opening) => (
              <motion.div
                key={opening.id}
                whileHover={{ y: -3 }}
                className="p-5 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl space-y-4 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {opening.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(opening as any).clients?.name || 'Client'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{opening.title}</h3>
                  <div className="text-xs font-mono text-slate-400">
                    Seniority: {opening.seniority} &bull; Headcount: {opening.headcount}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {opening.stack?.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-teal-300">
                    {formatCurrency(opening.salary_min || 0)} - {formatCurrency(opening.salary_max || 0)}/mo
                  </span>

                  <button
                    onClick={() => {
                      setSelectedOpeningId(opening.id);
                      setActiveTab('kanban');
                    }}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>View Kanban</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Talent Pool View */}
      {activeTab === 'talent-pool' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by name or skill..."
                value={talentSearch}
                onChange={(e) => setTalentSearch(e.target.value)}
                className="w-full h-8 pl-9 pr-3 text-xs rounded-xl border border-white/[0.12] bg-[#141822] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={seniorityFilter}
                onChange={(e) => setSeniorityFilter(e.target.value)}
                className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#141822] px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="all">All Seniorities</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>

              <select
                value={englishFilter}
                onChange={(e) => setEnglishFilter(e.target.value)}
                className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#141822] px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="all">All English</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
                <option value="Native">Native</option>
              </select>
            </div>
          </div>

          {/* Talent Pool Grid */}
          {filteredTalent.length === 0 ? (
            <div className="py-16 text-center metallic-surface rounded-2xl border border-white/10 space-y-3">
              <Users className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">No Candidates in Talent Pool</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Use the + Add Candidate button to add applicants to your recruiting talent pool.
                </p>
              </div>
              {canAdd && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-cyan-500/30 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Candidate</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTalent.map((person) => (
                <div
                  key={person.id}
                  className="p-5 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                        Candidate
                      </span>
                      <span className="text-xs font-mono text-slate-400">{person.country}</span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-100">{person.full_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {person.seniority} &bull; English {person.english_level}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {person.skills?.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#131620] text-slate-300 border border-white/5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                    <Link
                      href={`/people/${person.id}`}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
                    >
                      View Profile &rarr;
                    </Link>

                    {selectedOpening && (
                      <button
                        onClick={() => handleAddPersonToOpening(person)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all cursor-pointer"
                      >
                        + Match to Opening
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Candidate Modal Dialog */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        defaultOpeningId={selectedOpeningId}
        onClose={() => setIsAddModalOpen(false)}
        onCandidateCreated={handleCandidateCreated}
      />

      {/* Create Opening Modal Dialog */}
      <CreateOpeningDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpeningCreated={() => {
          loadOpenings();
        }}
      />
    </div>
  );
}
