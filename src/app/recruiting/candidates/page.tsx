'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { formatCurrency } from '@/lib/utils';
import { AddCandidateModal } from '@/components/recruiting/add-candidate-modal';
import { Person, Application, Document } from '@/types/database';
import {
  Search,
  UserPlus,
  Users,
  FileText,
  Briefcase,
  ArrowRight,
  Filter,
  Loader2,
  Inbox,
} from 'lucide-react';

export default function CandidatesPage() {
  const { currentUser } = useAuth();
  const canAdd = Permissions.canAddCandidate(currentUser.role);

  const [candidatesList, setCandidatesList] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [englishFilter, setEnglishFilter] = useState('all');
  const [seniorityFilter, setSeniorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const people = await DataService.getPeople();
      // Filter for candidate-type records (candidate, onboarding, rejected, bench)
      const candidateRecords = people.filter((p) =>
        ['candidate', 'rejected', 'onboarding', 'bench'].includes(p.status)
      );
      setCandidatesList(candidateRecords);
    } catch (err) {
      console.error('Failed to load candidate pool:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();

    const handleTalentSync = () => {
      loadCandidates();
    };
    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
    };
  }, [loadCandidates]);

  const handleCandidateCreated = (
    newPerson: Person,
    _application?: Application,
    _doc?: Document
  ) => {
    setCandidatesList((prev) => [newPerson, ...prev]);
  };

  const filteredCandidates = candidatesList.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      (p.country || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase());

    const matchesEnglish = englishFilter === 'all' || p.english_level === englishFilter;
    const matchesSeniority = seniorityFilter === 'all' || p.seniority === seniorityFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesEnglish && matchesSeniority && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.1]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Candidates & Talent Pool
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              RECRUITING POOL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Index of candidates, applicants, and available talent for instant assignment.
          </p>
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/recruiting"
            className="h-8 px-3 text-xs font-semibold rounded-xl border border-white/[0.12] bg-[#181d28] hover:bg-[#202736] text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>Kanban Pipeline</span>
          </Link>

          {canAdd && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Candidate</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 metallic-surface rounded-2xl border border-white/[0.1] shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, skill, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 pr-3 text-xs rounded-xl border border-white/[0.12] bg-[#141822] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-52 sm:w-64 shadow-inner"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#141822] px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="all">All Statuses ({candidatesList.length})</option>
            <option value="candidate">Active Candidates</option>
            <option value="onboarding">In Onboarding</option>
            <option value="rejected">Archived / Past</option>
          </select>

          <select
            value={englishFilter}
            onChange={(e) => setEnglishFilter(e.target.value)}
            className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#141822] px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="all">All English</option>
            <option value="B1">B1 (Intermediate)</option>
            <option value="B2">B2 (Upper)</option>
            <option value="C1">C1 (Advanced)</option>
            <option value="C2">C2 (Proficient)</option>
          </select>

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
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-slate-100">{filteredCandidates.length}</strong> candidates
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Loading candidates from Supabase...</span>
        </div>
      ) : filteredCandidates.length === 0 ? (
        /* Empty State */
        <div className="p-12 metallic-surface rounded-2xl border border-white/[0.12] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Candidates in Talent Pool</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {search || englishFilter !== 'all' || seniorityFilter !== 'all' || statusFilter !== 'all'
              ? 'No candidate matches the selected search criteria. Try resetting your filters.'
              : 'The talent pool is currently empty. Add your first candidate to start building your recruiting pipeline.'}
          </p>
          {canAdd && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Candidate</span>
            </button>
          )}
        </div>
      ) : (
        /* Candidates Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <motion.div
              key={candidate.id}
              whileHover={{ y: -2 }}
              className="p-5 rounded-2xl glass-panel border border-white/[0.08] hover:border-cyan-400/40 shadow-xl flex flex-col justify-between gap-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/people/${candidate.id}`}
                      className="font-bold text-sm text-white hover:text-cyan-300 transition-colors"
                    >
                      {candidate.full_name}
                    </Link>
                    <div className="text-[11px] font-mono text-slate-400">
                      {candidate.seniority} • {candidate.country}
                    </div>
                  </div>

                  <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shrink-0">
                    {candidate.status}
                  </span>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1">
                  {(candidate.skills || []).slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#131620] text-slate-300 border border-white/[0.08]"
                    >
                      {skill}
                    </span>
                  ))}
                  {(candidate.skills || []).length > 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 font-mono">
                      +{candidate.skills.length - 5}
                    </span>
                  )}
                </div>

                {/* Attributes */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono text-slate-400">
                  <div>
                    English: <span className="text-slate-200 font-semibold">{candidate.english_level}</span>
                  </div>
                  <div>
                    Salary:{' '}
                    <span className="text-teal-300 font-semibold">
                      {candidate.salary_expectation ? `${formatCurrency(candidate.salary_expectation)}/mo` : 'Negotiable'}
                    </span>
                  </div>
                  {candidate.timezone && (
                    <div className="col-span-2 truncate">
                      TZ: <span className="text-slate-300">{candidate.timezone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <Link
                  href={`/people/${candidate.id}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>View Full Profile & CV</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/people/${candidate.id}`}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  title="CV & Documents"
                >
                  <FileText className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
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
