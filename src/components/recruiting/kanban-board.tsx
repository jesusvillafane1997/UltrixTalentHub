'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import {
  PipelineStage,
  Application,
  Person,
  Opening,
  RejectionReason,
  Scorecard,
} from '@/types/database';
import { moveCandidateStage } from '@/actions/openings';
import { toast } from 'sonner';
import { RejectionModal } from './rejection-modal';
import { ScorecardModal } from './scorecard-modal';
import { RemoveFromPipelineModal } from './remove-from-pipeline-modal';
import {
  Clock,
  AlertTriangle,
  User,
  Star,
  CheckCircle2,
  ExternalLink,
  Plus,
  Building,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KanbanCandidateItem {
  applicationId: string;
  personId: string;
  name: string;
  photoUrl?: string | null;
  seniority: string;
  englishLevel: string;
  skills: string[];
  stageId: string;
  daysInStage: number;
  isStuck: boolean; // >= 7 days
  scorecardAvg?: number | null;
}

interface KanbanBoardProps {
  opening: Opening;
  stages: PipelineStage[];
  initialCandidates: KanbanCandidateItem[];
  onCandidateHire?: (personId: string) => void;
  onCandidateReject?: (personId: string, reason: RejectionReason, notes: string) => void;
  onCandidateRemove?: (applicationId: string) => void;
  onOpenAddCandidate?: (openingId: string) => void;
}

// Draggable Candidate Card Component
function DraggableCandidateCard({
  item,
  stages,
  onOpenScorecard,
  onMoveStage,
  onRemoveCandidate,
}: {
  item: KanbanCandidateItem;
  stages: PipelineStage[];
  onOpenScorecard: (item: KanbanCandidateItem) => void;
  onMoveStage: (item: KanbanCandidateItem, targetStageId: string) => void;
  onRemoveCandidate: (item: KanbanCandidateItem) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.applicationId,
    data: item,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'p-3.5 bg-[#181d28] rounded-xl border border-white/[0.1] shadow-sm hover:border-cyan-400/50 hover:shadow-[0_0_14px_rgba(0,240,255,0.15)] transition-all cursor-grab active:cursor-grabbing space-y-2.5 relative overflow-hidden group',
        isDragging ? 'opacity-30 border-dashed border-cyan-400' : '',
        item.isStuck ? 'border-amber-500/40 bg-gradient-to-br from-[#1a1c22] to-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.12)]' : ''
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/people/${item.personId}`}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-xs text-slate-100 truncate block hover:text-cyan-300 transition-colors"
          >
            <span>{item.name}</span>
          </Link>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {item.seniority} &bull; English: {item.englishLevel}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Scorecard pill if available */}
          {item.scorecardAvg ? (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5 shadow-[0_0_6px_rgba(0,240,255,0.2)]">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span>{item.scorecardAvg.toFixed(1)}</span>
            </span>
          ) : null}

          {/* Remove from pipeline button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCandidate(item);
            }}
            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
            title="Remove candidate from this opening pipeline"
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Remove from pipeline</span>
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {item.skills.slice(0, 3).map((s) => (
          <span
            key={s}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/5"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Footer: Days in stage & Quick stage dropdown */}
      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.08] text-[10px] gap-2">
        {item.isStuck ? (
          <span className="text-amber-400 font-semibold flex items-center gap-1 animate-pulse font-mono">
            <AlertTriangle className="h-3 w-3" />
            <span>Stuck ({item.daysInStage}d)</span>
          </span>
        ) : (
          <span className="text-slate-400 font-mono flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            <span>{item.daysInStage}d</span>
          </span>
        )}

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Quick Stage Select */}
          <select
            value={item.stageId}
            onChange={(e) => onMoveStage(item, e.target.value)}
            className="h-6 px-1.5 rounded-md bg-[#12151e] border border-white/10 text-[10px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer max-w-[95px] truncate"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenScorecard(item);
            }}
            className="text-cyan-400 hover:text-cyan-300 font-semibold text-[10px] cursor-pointer"
          >
            Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}

// Droppable Kanban Column Component
function KanbanColumn({
  stage,
  stages,
  openingId,
  candidates,
  onOpenScorecard,
  onOpenAddCandidate,
  onMoveStage,
  onRemoveCandidate,
}: {
  stage: PipelineStage;
  stages: PipelineStage[];
  openingId: string;
  candidates: KanbanCandidateItem[];
  onOpenScorecard: (item: KanbanCandidateItem) => void;
  onOpenAddCandidate?: (openingId: string) => void;
  onMoveStage: (item: KanbanCandidateItem, targetStageId: string) => void;
  onRemoveCandidate: (item: KanbanCandidateItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: stage,
  });

  const isTerminalHired = stage.name === 'Hired';
  const isTerminalRejected = stage.name === 'Rejected';
  const isAppliedStage = stage.name.toLowerCase() === 'applied' || stage.stage_order === 1;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 shrink-0 flex flex-col rounded-xl border border-white/[0.1] bg-[#141822]/90 p-3 transition-colors shadow-md',
        isOver ? 'border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(0,240,255,0.25)]' : '',
        isTerminalHired ? 'bg-emerald-950/15 border-emerald-500/30' : '',
        isTerminalRejected ? 'bg-rose-950/15 border-rose-500/30' : ''
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs text-slate-100">{stage.name}</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/[0.08] text-slate-300 border border-white/10">
            {candidates.length}
          </span>
        </div>

        {isAppliedStage && onOpenAddCandidate && (
          <button
            type="button"
            onClick={() => onOpenAddCandidate(openingId)}
            className="p-1 rounded-md text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-colors cursor-pointer"
            title="Add Candidate to Applied"
          >
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Applied Column Quick Action Button */}
      {isAppliedStage && onOpenAddCandidate && (
        <button
          type="button"
          onClick={() => onOpenAddCandidate(openingId)}
          className="w-full mb-3 py-2 px-3 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer group"
        >
          <UserPlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>+ Add Candidate</span>
        </button>
      )}

      {/* Candidate Cards List */}
      <div className="flex-1 space-y-2.5 min-h-[300px]">
        {candidates.map((candidate) => (
          <DraggableCandidateCard
            key={candidate.applicationId}
            item={candidate}
            stages={stages}
            onOpenScorecard={onOpenScorecard}
            onMoveStage={onMoveStage}
            onRemoveCandidate={onRemoveCandidate}
          />
        ))}

        {candidates.length === 0 && (
          <div className="h-28 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-xs text-slate-500 font-mono">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// Main Board
export function KanbanBoard({
  opening,
  stages,
  initialCandidates,
  onCandidateHire,
  onCandidateReject,
  onCandidateRemove,
  onOpenAddCandidate,
}: KanbanBoardProps) {
  const [candidates, setCandidates] = useState<KanbanCandidateItem[]>(initialCandidates);
  const [activeDragItem, setActiveDragItem] = useState<KanbanCandidateItem | null>(null);

  React.useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  // Rejection modal state
  const [pendingRejection, setPendingRejection] = useState<{
    candidate: KanbanCandidateItem;
    targetStageId: string;
  } | null>(null);

  // Scorecard modal state
  const [activeScorecardCandidate, setActiveScorecardCandidate] =
    useState<KanbanCandidateItem | null>(null);

  // Remove from pipeline modal state
  const [candidateToRemove, setCandidateToRemove] =
    useState<KanbanCandidateItem | null>(null);

  // Success alert
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = candidates.find((c) => c.applicationId === event.active.id);
    if (item) setActiveDragItem(item);
  };

  const handleMoveStage = async (candidate: KanbanCandidateItem, targetStageId: string) => {
    if (candidate.stageId === targetStageId) return;

    const targetStage = stages.find((s) => s.id === targetStageId);
    if (!targetStage) return;

    // Check if target stage is "Rejected" -> MUST trigger required rejection reason modal!
    if (targetStage.name === 'Rejected') {
      setPendingRejection({ candidate, targetStageId });
      return;
    }

    // Optimistic local state update
    setCandidates((prev) =>
      prev.map((c) =>
        c.applicationId === candidate.applicationId
          ? { ...c, stageId: targetStageId, daysInStage: 0, isStuck: false }
          : c
      )
    );

    const isHired = targetStage.name === 'Hired';

    if (isHired) {
      setSuccessBanner(
        `🎉 ${candidate.name} has been marked HIRED! Automatically converted to Onboarding Worker.`
      );
      toast.success(`${candidate.name} marked as Hired! Status transitioned to Onboarding.`);
      if (onCandidateHire) {
        onCandidateHire(candidate.personId);
      }
    } else {
      toast.success(`${candidate.name} moved to stage "${targetStage.name}".`);
    }

    // Persist to Supabase Database
    const res = await moveCandidateStage(candidate.applicationId, targetStageId);
    if (!res.success) {
      toast.error(res.error || 'Failed to update candidate stage in database.');
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const candidate = candidates.find((c) => c.applicationId === active.id);
    if (!candidate) return;

    const targetStageId = over.id as string;
    handleMoveStage(candidate, targetStageId);
  };

  const handleConfirmRejection = async (reason: RejectionReason, notes: string) => {
    if (!pendingRejection) return;

    const { candidate, targetStageId } = pendingRejection;

    setCandidates((prev) =>
      prev.map((c) =>
        c.applicationId === candidate.applicationId
          ? { ...c, stageId: targetStageId, daysInStage: 0, isStuck: false }
          : c
      )
    );

    setSuccessBanner(
      `Candidate ${candidate.name} moved to Rejected with category "${reason}". Indexed in Talent Pool.`
    );
    toast.success(`Candidate ${candidate.name} marked as Rejected (${reason}).`);

    if (onCandidateReject) {
      onCandidateReject(candidate.personId, reason, notes);
    }

    setPendingRejection(null);

    // Persist rejection to Supabase Database
    const res = await moveCandidateStage(candidate.applicationId, targetStageId, {
      rejectionReason: reason,
      rejectionNotes: notes,
    });
    if (!res.success) {
      toast.error(res.error || 'Failed to record rejection category in database.');
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
      }
    }
  };

  const handleSaveScorecard = (scorecardData: any) => {
    if (!activeScorecardCandidate) return;

    const avg =
      (scorecardData.technical +
        scorecardData.english +
        scorecardData.communication +
        scorecardData.culture_fit) /
      4;

    setCandidates((prev) =>
      prev.map((c) =>
        c.applicationId === activeScorecardCandidate.applicationId
          ? { ...c, scorecardAvg: avg }
          : c
      )
    );

    setSuccessBanner(
      `Scorecard recorded for ${activeScorecardCandidate.name} (Avg: ${avg.toFixed(
        1
      )} / 4.0 - ${scorecardData.recommendation}).`
    );
  };

  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      {/* Banner */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-semibold text-emerald-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban Stages Container - Strictly Contained Horizontal Scroll */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full max-w-full min-w-0 overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => {
              const stageCandidates = candidates.filter((c) => c.stageId === stage.id);
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  stages={stages}
                  openingId={opening.id}
                  candidates={stageCandidates}
                  onOpenScorecard={setActiveScorecardCandidate}
                  onOpenAddCandidate={onOpenAddCandidate}
                  onMoveStage={handleMoveStage}
                  onRemoveCandidate={setCandidateToRemove}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeDragItem ? (
            <div className="p-3.5 bg-card rounded-lg border-2 border-primary shadow-xl w-64 space-y-2 opacity-95">
              <div className="font-bold text-xs text-foreground">{activeDragItem.name}</div>
              <div className="text-[10px] text-muted-foreground">{activeDragItem.seniority}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Remove from Pipeline Modal */}
      {candidateToRemove && (
        <RemoveFromPipelineModal
          isOpen={true}
          candidateName={candidateToRemove.name}
          openingTitle={opening.title}
          applicationId={candidateToRemove.applicationId}
          onClose={() => setCandidateToRemove(null)}
          onRemoved={() => {
            const removedAppId = candidateToRemove.applicationId;
            setCandidates((prev) => prev.filter((c) => c.applicationId !== removedAppId));
            if (onCandidateRemove) {
              onCandidateRemove(removedAppId);
            }
            setCandidateToRemove(null);
          }}
        />
      )}

      {/* Rejection Reason Modal */}
      {pendingRejection && (
        <RejectionModal
          isOpen={true}
          candidateName={pendingRejection.candidate.name}
          onConfirm={handleConfirmRejection}
          onCancel={() => setPendingRejection(null)}
        />
      )}

      {/* Structured Scorecard Modal */}
      {activeScorecardCandidate && (
        <ScorecardModal
          isOpen={true}
          candidateName={activeScorecardCandidate.name}
          interviewType="Technical Interview"
          onSaveScorecard={handleSaveScorecard}
          onClose={() => setActiveScorecardCandidate(null)}
        />
      )}
    </div>
  );
}
