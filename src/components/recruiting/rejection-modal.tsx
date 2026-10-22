'use client';

import React, { useState } from 'react';
import { RejectionReason } from '@/types/database';
import { AlertCircle, X } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  candidateName: string;
  onConfirm: (reason: RejectionReason, notes: string) => void;
  onCancel: () => void;
}

export function RejectionModal({
  isOpen,
  candidateName,
  onConfirm,
  onCancel,
}: RejectionModalProps) {
  const [reason, setReason] = useState<RejectionReason>('skills');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('A rejection reason is required to maintain a reusable talent pool.');
      return;
    }
    onConfirm(reason, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <h3 className="text-base font-bold text-foreground">Required Rejection Reason</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Per Ultrix guidelines, <span className="font-semibold text-foreground">{candidateName}</span> requires a categorized rejection reason so their profile remains indexed and reusable in the Talent Pool.
        </p>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Rejection Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as RejectionReason)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="skills">Technical Skills Mismatch</option>
              <option value="english">English Proficiency Level</option>
              <option value="salary_expectations">Salary Expectations Mismatch</option>
              <option value="client_declined">Client Declined Candidate</option>
              <option value="withdrew">Candidate Withdrew</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Feedback Notes for Talent Pool (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="E.g., Great technical depth in React, but client required fluent C1 English. Keep in mind for LATAM clients."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs"
            >
              Confirm Rejection & Archive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
