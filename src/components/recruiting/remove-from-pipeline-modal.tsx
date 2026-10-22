'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { removeCandidateFromOpening } from '@/actions/openings';
import { UserMinus, AlertTriangle, X, Loader2, Users } from 'lucide-react';

interface RemoveFromPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  openingTitle?: string;
  applicationId: string;
  onRemoved?: () => void;
}

export function RemoveFromPipelineModal({
  isOpen,
  onClose,
  candidateName,
  openingTitle = 'this opening',
  applicationId,
  onRemoved,
}: RemoveFromPipelineModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await removeCandidateFromOpening(applicationId);

      if (res.success) {
        toast.success(`${candidateName} removed from pipeline`, {
          description: `Removed from "${openingTitle}". Talent record remains in Talent Pool.`,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        if (onRemoved) {
          onRemoved();
        }

        onClose();
      } else {
        toast.error(res.error || 'Failed to remove candidate from pipeline.');
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
          className="relative w-full max-w-md bg-[#141824] border border-white/[0.14] rounded-2xl shadow-2xl p-6 space-y-4 text-slate-100 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <UserMinus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Remove from Pipeline</h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Are you sure you want to remove <strong className="text-white">{candidateName}</strong> from{' '}
              <strong className="text-cyan-300">"{openingTitle}"</strong>?
            </p>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-2 text-[11px] font-mono leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                This will detach their application card from this board. Their candidate profile will remain safe in the general Talent Pool and can be re-added at any time.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-2 transition-all shadow-md shadow-rose-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Remove from Pipeline</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
