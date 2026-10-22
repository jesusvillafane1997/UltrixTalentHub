'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { deleteOpening } from '@/actions/openings';
import { AlertTriangle, Trash2, X, Loader2, Users } from 'lucide-react';

interface DeleteOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  opening: {
    id: string;
    title: string;
    candidateCount?: number;
  } | null;
  onDeleted?: () => void;
}

export function DeleteOpeningModal({
  isOpen,
  onClose,
  opening,
  onDeleted,
}: DeleteOpeningModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !opening) return null;

  const candidateCount = opening.candidateCount ?? 0;

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await deleteOpening(opening.id);
      if (res.success) {
        toast.success(`Opening "${opening.title}" deleted successfully.`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }
        onClose();
        if (onDeleted) {
          onDeleted();
        }
      } else {
        toast.error(res.error || 'Failed to delete opening.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred while deleting opening.');
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

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#141822] border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Top Red Specular Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161b26]/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Delete Job Opening</h2>
                <p className="text-xs text-slate-400">
                  Permanent removal of opening and recruitment pipeline
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
            <div className="text-sm text-slate-200">
              Are you sure you want to delete <strong className="text-white font-semibold">"{opening.title}"</strong>?
            </div>

            {/* Candidate Impact Warning */}
            {candidateCount > 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{candidateCount} Active Candidate{candidateCount === 1 ? '' : 's'} in Pipeline</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    This opening has <strong className="text-white font-semibold">{candidateCount}</strong> candidate{candidateCount === 1 ? '' : 's'} linked. Deleting this opening will cleanly detach their applications from this pipeline.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Candidate profile records in the workforce directory will <strong className="text-slate-300">remain safe and intact</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-400">
                This opening has no active candidates in pipeline. Deleting it will permanently remove the requisition record and all associated metadata.
              </div>
            )}

            <p className="text-xs text-rose-300/80 font-mono">
              This action cannot be undone.
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
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Opening</span>
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
