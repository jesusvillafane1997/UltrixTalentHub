'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { Person, Application, Document, PersonStatus } from '@/types/database';
import { PersonProfile } from '@/components/people/person-profile';
import { AddCandidateModal } from '@/components/recruiting/add-candidate-modal';
import { formatCurrency, cn } from '@/lib/utils';
import {
  UserCheck,
  Users,
  Search,
  Fingerprint,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Briefcase,
  Building,
  Globe,
  SlidersHorizontal,
  TableProperties,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';

function PeopleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get('id');

  const { currentUser, isAdminOptIn } = useAuth();
  const canAdd = Permissions.canAddCandidate(currentUser.role);
  const canSeeSalary = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(initialId);
  const [activeTab, setActiveTab] = useState<'all' | 'workers' | 'bench' | 'candidate'>('all');
  const [search, setSearch] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState('all');
  const [englishFilter, setEnglishFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  async function loadPeople() {
    setLoading(true);
    try {
      const data = await DataService.getPeople();
      setPeople(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeople();

    const handleTalentSync = () => {
      loadPeople();
    };

    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, []);

  useEffect(() => {
    if (initialId && people.some((p) => p.id === initialId)) {
      setSelectedPersonId(initialId);
    }
  }, [initialId, people]);

  const selectedPerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) || null
    : null;

  const handleUpdateStatus = (newStatus: Person['status']) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === selectedPersonId ? { ...p, status: newStatus } : p))
    );
  };

  const handleCandidateCreated = (
    newPerson: Person,
    _application?: Application,
    _doc?: Document
  ) => {
    setPeople((prev) => [newPerson, ...prev]);
    setSelectedPersonId(newPerson.id);
  };

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: people.length,
      workers: people.filter((p) => ['active', 'onboarding'].includes(p.status)).length,
      bench: people.filter((p) => p.status === 'bench').length,
      candidate: people.filter((p) => p.status === 'candidate').length,
    };
  }, [people]);

  // Filtered people
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      // Tab filtering
      if (activeTab === 'workers' && !['active', 'onboarding'].includes(p.status)) return false;
      if (activeTab === 'bench' && p.status !== 'bench') return false;
      if (activeTab === 'candidate' && p.status !== 'candidate') return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.full_name.toLowerCase().includes(q);
        const matchesEmail = p.email.toLowerCase().includes(q);
        const matchesSkills = p.skills && p.skills.some((s) => s.toLowerCase().includes(q));
        const matchesCountry = p.country.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesSkills && !matchesCountry) return false;
      }

      // Seniority
      if (seniorityFilter !== 'all' && p.seniority !== seniorityFilter) return false;

      // English
      if (englishFilter !== 'all' && p.english_level !== englishFilter) return false;

      return true;
    });
  }, [people, activeTab, search, seniorityFilter, englishFilter]);

  const statusBadges: Record<
    PersonStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    active: {
      label: 'Active Worker',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
    },
    bench: {
      label: 'Bench',
      bg: 'bg-amber-500/15 border-amber-500/30',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    onboarding: {
      label: 'Onboarding',
      bg: 'bg-cyan-500/15 border-cyan-500/30',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
    },
    candidate: {
      label: 'Candidate',
      bg: 'bg-teal-500/15 border-teal-500/30',
      text: 'text-teal-300',
      dot: 'bg-teal-400',
    },
    offboarded: {
      label: 'Offboarded',
      bg: 'bg-slate-700/30 border-slate-600/30',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
    },
    rejected: {
      label: 'Talent Pool',
      bg: 'bg-slate-800/40 border-slate-700/40',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.1]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              People &amp; Talent Directory
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              SINGLE RECORD PER HUMAN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified talent profiles spanning applicant tracking, client assignments, compensation, and legal contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAdd && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Candidate</span>
            </button>
          )}
        </div>
      </div>

      {/* If a person is currently selected, render their Profile with Back Button */}
      {selectedPerson ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#141822] border border-white/[0.08]">
            <button
              onClick={() => setSelectedPersonId(null)}
              className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>&larr; Return to People Directory Table</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Switch Profile:</span>
              <select
                value={selectedPerson.id}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="h-7 text-xs font-bold rounded-lg border border-white/10 bg-[#181d29] px-2 text-slate-100 cursor-pointer"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.status.toUpperCase()} - {p.seniority})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PersonProfile
            key={selectedPerson.id}
            person={selectedPerson}
            onUpdatePersonStatus={handleUpdateStatus}
          />
        </div>
      ) : (
        /* Master People Directory View */
        <div className="space-y-5">
          {/* Status Tabs Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All People', count: counts.all },
                { id: 'workers', label: 'Active Workers', count: counts.workers },
                { id: 'bench', label: 'Bench Readiness', count: counts.bench },
                { id: 'candidate', label: 'Candidates', count: counts.candidate },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer',
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                        : 'text-slate-400 hover:text-slate-200 bg-[#161a25] border border-white/[0.06] hover:bg-white/[0.04]'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold',
                        isSelected ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/5 text-slate-500'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter name, skill, country..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-9 pr-3 text-xs rounded-xl border border-white/[0.12] bg-[#141822] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-48 sm:w-56 shadow-inner"
                />
              </div>

              <select
                value={seniorityFilter}
                onChange={(e) => setSeniorityFilter(e.target.value)}
                className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#141822] px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="all">All Seniority</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Principal">Principal</option>
              </select>

              <select
                value={englishFilter}
                onChange={(e) => setEnglishFilter(e.target.value)}
                className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#141822] px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="all">All English</option>
                <option value="B1">B1 Intermediate</option>
                <option value="B2">B2 Upper Int</option>
                <option value="C1">C1 Fluent</option>
                <option value="C2">C2 Bilingual</option>
                <option value="Native">Native</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="metallic-surface rounded-2xl border border-white/[0.12] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#181d28] border-b border-white/[0.1] text-slate-400 uppercase text-[10px] font-mono tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Human Identity</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Seniority &amp; English</th>
                    <th className="px-4 py-3.5">Location &amp; Timezone</th>
                    <th className="px-4 py-3.5">Core Tech Stack</th>
                    {canSeeSalary && <th className="px-4 py-3.5">Salary Expectation</th>}
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredPeople.map((person) => {
                    const statusMeta = statusBadges[person.status] || statusBadges.candidate;

                    return (
                      <tr
                        key={person.id}
                        onClick={() => setSelectedPersonId(person.id)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      >
                        {/* Identity */}
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                              {person.full_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {person.email}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 w-fit',
                              statusMeta.bg,
                              statusMeta.text
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusMeta.dot)} />
                            <span>{statusMeta.label}</span>
                          </span>
                        </td>

                        {/* Seniority & English */}
                        <td className="px-4 py-3 font-mono text-slate-200">
                          <span className="font-bold">{person.seniority}</span>
                          <span className="text-slate-500 mx-1.5">&bull;</span>
                          <span className="text-cyan-300">{person.english_level}</span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                          <div>{person.country}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {person.timezone}
                          </div>
                        </td>

                        {/* Key Skills */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {person.skills && person.skills.length > 0 ? (
                              person.skills.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[9px] px-2 py-0.5 rounded-md bg-[#161a25] text-slate-300 border border-white/5"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Generalist</span>
                            )}
                            {person.skills && person.skills.length > 3 && (
                              <span className="text-[9px] px-1 py-0.5 rounded-md bg-white/5 text-slate-500 font-mono">
                                +{person.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Comp / Expectation */}
                        {canSeeSalary && (
                          <td className="px-4 py-3 font-mono">
                            {person.salary_expectation ? (
                              <span className="font-semibold text-teal-300">
                                {formatCurrency(person.salary_expectation)}/mo
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>
                        )}

                        {/* Action Link */}
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/people/${person.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <span>Profile</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPeople.length === 0 && (
                <div className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                      <Users className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-200">
                        {search || activeTab !== 'all'
                          ? 'No matching people found'
                          : 'No talent records in database yet'}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {search || activeTab !== 'all'
                          ? 'Try adjusting your status filter or search query.'
                          : 'Your live database is connected. Add a candidate with a CV to populate the talent directory.'}
                      </p>
                    </div>
                    {canAdd && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add First Candidate</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCandidateCreated={handleCandidateCreated}
      />
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-slate-500">
          Loading talent directory telemetry...
        </div>
      }
    >
      <PeopleContent />
    </Suspense>
  );
}
