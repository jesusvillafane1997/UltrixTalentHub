'use client';

import React, { useState } from 'react';
import { Scorecard, RecommendationType } from '@/types/database';
import { useAuth } from '@/context/auth-context';
import { Star, X, Check, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScorecardModalProps {
  isOpen: boolean;
  candidateName: string;
  interviewType: string;
  existingScorecard?: Scorecard;
  onSaveScorecard: (scorecard: Omit<Scorecard, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

export function ScorecardModal({
  isOpen,
  candidateName,
  interviewType,
  existingScorecard,
  onSaveScorecard,
  onClose,
}: ScorecardModalProps) {
  const { currentUser } = useAuth();

  const [technical, setTechnical] = useState(existingScorecard?.technical || 3);
  const [english, setEnglish] = useState(existingScorecard?.english || 3);
  const [communication, setCommunication] = useState(existingScorecard?.communication || 3);
  const [cultureFit, setCultureFit] = useState(existingScorecard?.culture_fit || 4);
  const [recommendation, setRecommendation] = useState<RecommendationType>(
    existingScorecard?.recommendation || 'Yes'
  );
  const [notes, setNotes] = useState(existingScorecard?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveScorecard({
      interview_id: existingScorecard?.interview_id || crypto.randomUUID(),
      interviewer_id: currentUser.id,
      technical,
      english,
      communication,
      culture_fit: cultureFit,
      recommendation,
      notes,
    });
    onClose();
  };

  const renderRatingButtons = (
    label: string,
    value: number,
    onChange: (val: number) => void
  ) => (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border">
      <span className="font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              'h-7 w-7 rounded-md font-bold text-xs transition-colors',
              value === num
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Structured Interview Scorecard</h3>
            <p className="text-xs text-muted-foreground">
              {candidateName} • {interviewType}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted/40 rounded-lg space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase">
              Standard Evaluation Criteria (1 to 4)
            </div>
            {renderRatingButtons('Technical Capability & Code Depth', technical, setTechnical)}
            {renderRatingButtons('English Proficiency (Fluency & Accent)', english, setEnglish)}
            {renderRatingButtons('Communication & Problem Articulation', communication, setCommunication)}
            {renderRatingButtons('Culture Fit & Remote Autonomy', cultureFit, setCultureFit)}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Overall Hiring Recommendation <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(['Strong yes', 'Yes', 'No', 'Strong no'] as RecommendationType[]).map((rec) => (
                <button
                  key={rec}
                  type="button"
                  onClick={() => setRecommendation(rec)}
                  className={cn(
                    'p-2 rounded-lg font-bold border transition-colors text-center',
                    recommendation === rec
                      ? rec.includes('yes')
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 shadow-xs'
                        : 'bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-950 dark:text-rose-200 shadow-xs'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Interviewer Notes & Rationale
            </label>
            <textarea
              rows={4}
              placeholder="Detail observations, architecture insights, English level context, and team placement fit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-xs"
            >
              Save Scorecard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
