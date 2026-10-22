'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { Review, ActionItem } from '@/types/database';
import { formatDate, cn } from '@/lib/utils';
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Building,
  Calendar,
  Loader2,
  Inbox,
} from 'lucide-react';
import { PerformanceRadar } from '@/components/reviews/performance-radar';

export default function ReviewsPage() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([DataService.getReviews(), DataService.getActionItems()]).then(
      ([revs, items]) => {
        if (isMounted) {
          setReviews(revs);
          setActionItems(items);
          if (revs.length > 0) {
            setSelectedReviewId(revs[0].id);
          }
          setLoading(false);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedReview = reviews.find((r) => r.id === selectedReviewId) || reviews[0] || null;
  const selectedPerson = selectedReview?.people;

  // Acknowledge review handler (HR Lead or Admin)
  const handleAcknowledge = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: 'Acknowledged by HR',
              acknowledged_by: currentUser.id,
              acknowledged_at: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const handleToggleActionItem = (itemId: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    );
  };

  const isHrOrAdmin = ['admin', 'hr_manager'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Monthly Performance Review Cycles
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              STAFF AUG GOVERNANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generated on the 1st of each month for active client assignments. Due on the 10th.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#141822] px-3 py-1.5 rounded-xl border border-white/10">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next Cycle Generation: <strong className="text-white">Nov 1, 2026</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Loading performance evaluations...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 metallic-surface rounded-2xl border border-white/[0.12] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Monthly Reviews Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Reviews are automatically created for active worker assignments on the 1st of each month. When reviews are submitted, their health metrics, scores, and triage action items appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Featured Performance Radar Inspection Spotlight */}
          {selectedReview && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <PerformanceRadar review={selectedReview} interactive={true} />
              </div>

              {/* Selected Review Summary Card */}
              <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                      FOCUSED REVIEW AUDIT
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {selectedPerson?.full_name || 'Worker'}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border',
                      selectedReview.health === 'Green'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                    )}
                  >
                    HEALTH: {selectedReview.health}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#141822] border border-white/5 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                      Client Feedback Source: {selectedReview.feedback_source || 'Direct Assessment'}
                    </div>
                    <p className="italic text-slate-200 leading-relaxed">
                      "{selectedReview.client_feedback || 'No comments recorded.'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#141822] border border-white/5">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Wins</span>
                      <span className="text-emerald-300 font-medium">{selectedReview.wins || '—'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141822] border border-white/5">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Concerns</span>
                      <span className={cn('font-medium', selectedReview.health === 'Red' ? 'text-rose-300' : 'text-slate-300')}>
                        {selectedReview.concerns || 'None reported'}
                      </span>
                    </div>
                  </div>

                  {/* Action Items for Red health */}
                  {actionItems.filter((a) => a.review_id === selectedReview.id).length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Mandatory Action Plan (Red Health Triage)</span>
                      </div>
                      <div className="space-y-1.5">
                        {actionItems
                          .filter((a) => a.review_id === selectedReview.id)
                          .map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-2 p-2 rounded-lg bg-[#141822] border border-white/5 cursor-pointer text-[11px]"
                            >
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => handleToggleActionItem(item.id)}
                                className="mt-0.5 rounded border-white/20 text-cyan-500 focus:ring-0"
                              />
                              <span className={cn('text-slate-200', item.done ? 'line-through text-slate-500' : '')}>
                                {item.description}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    Status: <strong className="text-white">{selectedReview.status}</strong>
                  </span>

                  {isHrOrAdmin && selectedReview.status === 'Submitted' && (
                    <button
                      onClick={() => handleAcknowledge(selectedReview.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledge as HR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Cards List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
              All Active Monthly Reviews ({reviews.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((rev) => {
                const person = rev.people;
                const assignment = rev.assignments;
                const clientName = assignment?.clients?.name || 'Direct';
                const isSelected = rev.id === selectedReviewId;

                return (
                  <motion.div
                    key={rev.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedReviewId(rev.id)}
                    className={cn(
                      'p-4 rounded-2xl glass-card transition-all cursor-pointer border space-y-3',
                      isSelected
                        ? 'border-cyan-400/70 ring-2 ring-cyan-400/20 bg-cyan-950/10'
                        : 'border-white/[0.08] hover:border-white/20'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-white">{person?.full_name || 'Worker'}</h4>
                        <div className="text-xs text-slate-400">
                          {clientName} • {assignment?.role_title || 'Placed Talent'}
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                          rev.health === 'Green'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                        )}
                      >
                        {rev.health} ({rev.average_score?.toFixed(1) || '0.0'})
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                      <div className="p-1 rounded bg-[#141822] border border-white/5">
                        <span className="text-slate-500 block text-[8px]">DEL</span>
                        <strong className="text-white">{rev.rating_delivery || 0}</strong>
                      </div>
                      <div className="p-1 rounded bg-[#141822] border border-white/5">
                        <span className="text-slate-500 block text-[8px]">COM</span>
                        <strong className="text-white">{rev.rating_communication || 0}</strong>
                      </div>
                      <div className="p-1 rounded bg-[#141822] border border-white/5">
                        <span className="text-slate-500 block text-[8px]">REL</span>
                        <strong className="text-white">{rev.rating_reliability || 0}</strong>
                      </div>
                      <div className="p-1 rounded bg-[#141822] border border-white/5">
                        <span className="text-slate-500 block text-[8px]">PRO</span>
                        <strong className="text-white">{rev.rating_proactivity || 0}</strong>
                      </div>
                      <div className="p-1 rounded bg-[#141822] border border-white/5">
                        <span className="text-slate-500 block text-[8px]">SAT</span>
                        <strong className="text-white">{rev.rating_client_satisfaction || 0}</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic line-clamp-2">
                      "{rev.client_feedback || 'No comments recorded.'}"
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
