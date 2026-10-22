'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { deleteCandidate } from '@/actions/candidates';
import { Person } from '@/types/database';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  ShieldAlert,
  FileText,
  Briefcase,
  Archive,
} from 'lucide-react';

interface DeleteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  hasAssignments?: boolean;
  hasContracts?: boolean;
  onDeleted?: () => void;
}

export function DeleteCandidateModal({
  isOpen,
  onClose,
  person,
  hasAssignments = false,
  hasContracts = false,
  onDeleted,
}: DeleteCandidateModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !person) return null;

  const isBlockedFromHardDeletion =
    person.status === 'active' || hasAssignments;

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await deleteCandidate(person.id);
      if (res.success) {
        toast.success(`Candidate ${person.full_name} was permanently purged.`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }
        onClose();
        if (onDeleted) {
          onDeleted();
        }
      } else {
        toast.error(res.error || 'Failed to delete candidate.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred while deleting candidate.');
    } finally {
      setLoading(false);
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
          onClick={loading ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#141822] border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Top Specular Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
              isBlockedFromHardDeletion ? 'via-amber-400' : 'via-rose-500'
            } to-transparent`}
          />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161b26]/80">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isBlockedFromHardDeletion
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                }`}
              >
                {isBlockedFromHardDeletion ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {isBlockedFromHardDeletion ? 'Candidate Protected from Deletion' : 'Delete Candidate Record'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isBlockedFromHardDeletion
                    ? 'Compliance & financial audit safeguards'
                    : 'Permanent purge of talent record and documents'}
                </p>
              </div>
            </div>
            <button
              disabled={loading}
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-4">
            {isBlockedFromHardDeletion ? (
              /* Blocked State */
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Hard Deletion Blocked for Active / Placed Workers</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    <strong className="text-white">{person.full_name}</strong> is currently designated as an{' '}
                    <span className="font-semibold text-emerald-400 uppercase">{person.status}</span> workforce member
                    {hasAssignments ? ' or has client placement assignments on record' : ''}.
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Under Ultrix Talent Hub data integrity rules, active workers with contract or assignment history cannot be permanently purged to protect financial, invoicing, and legal audit trails.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 flex items-start gap-2.5">
                  <Archive className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Recommended Alternative:</strong>
                    <span>
                      You can change their status to <strong className="text-slate-200">Bench</strong> or <strong className="text-slate-200">Offboarded</strong> in the profile header instead of deleting.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Eligible for Deletion */
              <div className="space-y-4">
                <div className="text-sm text-slate-200">
                  Are you sure you want to permanently delete candidate{' '}
                  <strong className="text-white font-semibold">"{person.full_name}"</strong>?
                </div>

                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2 text-xs">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Permanent Cascading Deletion</span>
                  </div>
                  <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
                    <li>All candidate applications across all job openings will be detached.</li>
                    <li>Interview notes, scorecards, and evaluations will be deleted.</li>
                    <li>Uploaded CV and document files in Supabase Storage will be purged.</li>
                    <li>This action cannot be undone or recovered.</li>
                  </ul>
                </div>

                <p className="text-xs text-rose-400 font-mono">
                  This candidate will be permanently removed from Ultrix Talent Hub.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Purging Candidate...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
