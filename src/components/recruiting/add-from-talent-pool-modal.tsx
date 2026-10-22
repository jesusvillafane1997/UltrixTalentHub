'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { addCandidateToOpening } from '@/actions/openings';
import { getAvailableTalentPoolCandidates } from '@/actions/candidates';
import { Opening, Person } from '@/types/database';
import {
  Users,
  Search,
  CheckCircle2,
  X,
  Loader2,
  Briefcase,
  Globe,
  Sparkles,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddFromTalentPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  opening: Opening;
  onCandidateAdded?: (application?: any) => void;
  onOpenCreateNew?: () => void;
}

export function AddFromTalentPoolModal({
  isOpen,
  onClose,
  opening,
  onCandidateAdded,
  onOpenCreateNew,
}: AddFromTalentPoolModalProps) {
  const { currentUser } = useAuth();
  const canAdd = Permissions.canAddCandidate(currentUser.role);

  const [candidates, setCandidates] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [source, setSource] = useState('Talent Pool Sourcing');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !opening.id) return;

    let isMounted = true;
    setLoading(true);
    setSelectedPersonId(null);
    setSearchQuery('');

    getAvailableTalentPoolCandidates(opening.id)
      .then((data) => {
        if (isMounted) {
          setCandidates(data);
          if (data.length > 0) {
            setSelectedPersonId(data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching talent pool candidates:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, opening.id]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter((c) => {
      const nameMatches = c.full_name.toLowerCase().includes(q);
      const emailMatches = c.email.toLowerCase().includes(q);
      const skillsMatch = (c.skills || []).some((s) => s.toLowerCase().includes(q));
      const countryMatches = c.country?.toLowerCase().includes(q);
      return nameMatches || emailMatches || skillsMatch || countryMatches;
    });
  }, [candidates, searchQuery]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!canAdd) {
      toast.error('Permission denied: Only Admin, HR Manager, and Recruiter can add candidates.');
      return;
    }

    if (!selectedPersonId) {
      toast.error('Please select a candidate from the talent pool.');
      return;
    }

    const selectedPerson = candidates.find((c) => c.id === selectedPersonId);

    try {
      setSubmitting(true);
      const res = await addCandidateToOpening(selectedPersonId, opening.id, source);

      if (res.success) {
        toast.success(
          `${selectedPerson?.full_name || 'Candidate'} added to "${opening.title}"`,
          {
            description: 'Placed into Applied stage (Stage 1).',
          }
        );

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        const appPayload = {
          ...(res.application || {}),
          people: res.application?.people || selectedPerson,
          person_id: selectedPersonId,
          opening_id: opening.id,
          stage_id: res.application?.stage_id || '00000001-0000-0000-0000-000000000001',
        };

        if (onCandidateAdded) {
          onCandidateAdded(appPayload);
        }

        onClose();
      } else {
        toast.error(res.error || 'Failed to add candidate to opening.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={submitting ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#141822] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden z-10 my-6"
        >
          {/* Top Cyan Specular Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161b26]/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Add from Talent Pool
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>Target Opening:</span>
                  <strong className="text-cyan-300">{opening.title}</strong>
                  <span>&bull;</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Stage: Applied</span>
                </div>
              </div>
            </div>

            <button
              disabled={submitting}
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[calc(85vh-140px)] overflow-y-auto">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search candidates by name, tech skill, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#181d29] border border-white/[0.12] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Candidate List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="text-xs font-mono">Fetching talent pool directory...</span>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-8 metallic-surface rounded-xl border border-white/[0.08] text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {candidates.length === 0
                    ? 'No available talent pool candidates found'
                    : 'No candidates matched your search criteria'}
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  {candidates.length === 0
                    ? 'All candidates in your workforce directory are already linked to this pipeline, or no candidates exist.'
                    : 'Try searching with a different skill, name, or country.'}
                </p>
                {onOpenCreateNew && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateNew();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create New Candidate Instead</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredCandidates.map((c) => {
                  const isSelected = selectedPersonId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedPersonId(c.id)}
                      className={cn(
                        'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs',
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                          : 'bg-[#181d29]/70 hover:bg-[#1a202e] border-white/[0.08]'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{c.full_name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-300">
                            {c.seniority}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                            {c.english_level}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span>{c.email}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-500" />
                            {c.country}
                          </span>
                        </div>

                        {c.skills && c.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {c.skills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-300"
                              >
                                {s}
                              </span>
                            ))}
                            {c.skills.length > 4 && (
                              <span className="text-[9px] font-mono text-slate-500">
                                +{c.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border flex items-center justify-center transition-all',
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                              : 'border-white/20 bg-transparent'
                          )}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 fill-current" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Source Selector */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Application Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#181d29] border border-white/[0.1] px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="Talent Pool Sourcing">Talent Pool Sourcing (Existing Candidate)</option>
                <option value="Internal Sourcing">Internal Sourcing</option>
                <option value="Recruiter Recommendation">Recruiter Recommendation</option>
                <option value="Employee Referral">Employee Referral</option>
                <option value="Client Request">Client Request</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#161b26]/90">
            <div className="text-xs text-slate-400 font-mono">
              {candidates.length} available talent pool candidate{candidates.length === 1 ? '' : 's'}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting || !selectedPersonId}
                onClick={handleAdd}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding to Pipeline...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add to Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
