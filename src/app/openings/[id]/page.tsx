'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { formatCurrency, cn } from '@/lib/utils';
import { KanbanBoard, KanbanCandidateItem } from '@/components/recruiting/kanban-board';
import { AddCandidateModal } from '@/components/recruiting/add-candidate-modal';
import { AddFromTalentPoolModal } from '@/components/recruiting/add-from-talent-pool-modal';
import { EditOpeningDialog } from '@/components/openings/edit-opening-dialog';
import { DeleteOpeningModal } from '@/components/openings/delete-opening-modal';
import { RejectionReason, Person, Application, Document, Opening, PipelineStage } from '@/types/database';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  UserPlus,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Share2,
  Trash2,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';

function OpeningKanbanContent() {
  const params = useParams();
  const router = useRouter();
  const openingId = params?.id as string;

  const { currentUser, isAdminOptIn } = useAuth();
  const canSeeComp = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);
  const canAdd = Permissions.canAddCandidate(currentUser.role);
  const canDelete = Permissions.canDeleteOpening(currentUser.role);

  const [opening, setOpening] = useState<Opening | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [candidates, setCandidates] = useState<KanbanCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTalentPoolModalOpen, setIsTalentPoolModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const loadOpeningData = useCallback(async () => {
    if (!openingId) return;
    try {
      setLoading(true);
      const [op, stageList, apps] = await Promise.all([
        DataService.getOpeningById(openingId),
        DataService.getPipelineStages(),
        DataService.getApplicationsForOpening(openingId),
      ]);

      setOpening(op);
      setStages(stageList);

      const kanbanItems: KanbanCandidateItem[] = (apps || [])
        .filter((app: any) => app.people)
        .map((app: any) => {
          const person = app.people;
          const daysInStage = app.stage_changed_at
            ? Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(app.stage_changed_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : 0;

          let scoreAvg: number | undefined = undefined;
          const scorecardsList =
            app.scorecards ||
            (app.interviews
              ? app.interviews.flatMap((i: any) =>
                  Array.isArray(i.scorecards) ? i.scorecards : i.scorecards ? [i.scorecards] : []
                )
              : []);
          if (scorecardsList.length > 0) {
            const sc = scorecardsList[0];
            scoreAvg = (sc.technical + sc.english + sc.communication + sc.culture_fit) / 4;
          }

          return {
            applicationId: app.id,
            personId: person?.id || app.person_id,
            name: person?.full_name || 'Candidate',
            photoUrl: person?.photo_url || null,
            seniority: person?.seniority || 'Mid',
            englishLevel: person?.english_level || 'B2',
            skills: person?.skills || [],
            stageId: app.stage_id,
            daysInStage,
            isStuck: daysInStage >= 7,
            scorecardAvg: scoreAvg,
          };
        });

      setCandidates(kanbanItems);
    } catch (err) {
      console.error('Failed to load opening data:', err);
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    loadOpeningData();

    const handleTalentSync = () => {
      loadOpeningData();
    };
    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, [loadOpeningData]);

  const handleCandidateCreated = async (
    newPerson: Person,
    application?: Application,
    _doc?: Document
  ) => {
    if (application && application.opening_id === openingId) {
      const newKanbanItem: KanbanCandidateItem = {
        applicationId: application.id,
        personId: newPerson.id,
        name: newPerson.full_name,
        photoUrl: newPerson.photo_url || null,
        seniority: newPerson.seniority,
        englishLevel: newPerson.english_level,
        skills: newPerson.skills || [],
        stageId: application.stage_id,
        daysInStage: 0,
        isStuck: false,
      };
      setCandidates((prev) => [
        newKanbanItem,
        ...prev.filter((c) => c.applicationId !== application.id),
      ]);
    }
    await loadOpeningData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono">Loading recruitment pipeline from database...</span>
      </div>
    );
  }

  if (!opening) {
    return (
      <div className="metallic-surface rounded-2xl border border-white/[0.12] p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Opening Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          The requested job opening does not exist in the live database or has been archived.
        </p>
        <Link
          href="/openings"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Openings</span>
        </Link>
      </div>
    );
  }

  const client = (opening as any).clients;
  const owner = (opening as any).users;
  const hiredCount = candidates.filter((c) => {
    const stage = stages.find((s) => s.id === c.stageId);
    return stage?.name === 'Hired';
  }).length;

  return (
    <div className="flex flex-col w-full max-w-full min-w-0 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/openings" className="hover:text-cyan-400 transition-colors flex items-center gap-1 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Openings</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-slate-200 font-semibold truncate">{opening.title}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] shrink-0">
          <span className="text-slate-400">Capacity:</span>
          <span className={cn('font-bold', hiredCount >= opening.headcount ? 'text-emerald-400' : 'text-cyan-300')}>
            {hiredCount} / {opening.headcount} Hired
          </span>
        </div>
      </div>

      {/* Opening Header Panel - Responsive Layout */}
      <header className="p-5 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        {/* Left: Opening Title & Meta Info */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white break-words">
              {opening.title}
            </h1>
            <span
              className={cn(
                'text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border shrink-0',
                opening.status === 'Open'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                  : 'bg-white/10 text-slate-300 border-white/10'
              )}
            >
              {opening.status}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 shrink-0">
              {opening.seniority}
            </span>
          </div>

          {/* Client, Headcount, Rates, Owner Metadata */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{client?.name || 'Direct Client'}</span>
            </span>
            <span>&bull;</span>
            <span>
              Headcount: <strong className="text-white">{opening.headcount}</strong> ({hiredCount} filled)
            </span>
            {owner?.name && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Owner: <strong className="text-slate-300">{owner.name}</strong></span>
                </span>
              </>
            )}
            {canSeeComp && (opening.salary_min != null || opening.salary_max != null) && (
              <>
                <span>&bull;</span>
                <span>
                  Target Comp:{' '}
                  <strong className="text-teal-300">
                    {formatCurrency(opening.salary_min)} — {formatCurrency(opening.salary_max)}
                  </strong>
                </span>
              </>
            )}
            {canSeeComp && (opening.bill_rate_min != null || opening.bill_rate_max != null) && (
              <>
                <span>&bull;</span>
                <span>
                  Bill Rate:{' '}
                  <strong className="text-cyan-300">
                    {formatCurrency(opening.bill_rate_min)} — {formatCurrency(opening.bill_rate_max)}
                  </strong>
                </span>
              </>
            )}
          </div>

          {/* Tech Stack Badges */}
          {opening.stack && opening.stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {opening.stack.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/5"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions Group - Clean, Organized & Non-Clipping */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          {canAdd && (
            <button
              type="button"
              onClick={() => setIsTalentPoolModalOpen(true)}
              className="h-9 px-3 text-xs font-semibold rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
              title="Add candidate from Talent Pool"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add from Talent Pool</span>
            </button>
          )}

          {canAdd && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Candidate</span>
            </button>
          )}

          {/* Administrative / Destructive Actions Dropdown Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className={cn(
                'h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center transition-all cursor-pointer',
                isMoreMenuOpen
                  ? 'bg-white/20 text-white border-white/25 shadow-md shadow-cyan-500/10'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              )}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">More options</span>
            </button>

            {/* Dropdown Menu Popup */}
            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#141824] border border-white/[0.14] shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="w-full px-2.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Edit Opening</span>
                </button>

                {canDelete && (
                  <>
                    <div className="h-px bg-white/[0.08] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-full px-2.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete Opening</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <KanbanBoard
        opening={opening}
        stages={stages}
        initialCandidates={candidates}
        onCandidateHire={() => loadOpeningData()}
        onCandidateReject={() => loadOpeningData()}
        onCandidateRemove={() => loadOpeningData()}
        onOpenAddCandidate={() => setIsAddModalOpen(true)}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultOpeningId={opening.id}
        onCandidateCreated={handleCandidateCreated}
      />

      {/* Add from Talent Pool Modal */}
      <AddFromTalentPoolModal
        isOpen={isTalentPoolModalOpen}
        onClose={() => setIsTalentPoolModalOpen(false)}
        opening={opening}
        onCandidateAdded={(newApp) => {
          if (newApp && newApp.people) {
            const p = newApp.people;
            const newKanbanItem: KanbanCandidateItem = {
              applicationId: newApp.id,
              personId: p.id || newApp.person_id,
              name: p.full_name || 'Candidate',
              photoUrl: p.photo_url || null,
              seniority: p.seniority || 'Mid',
              englishLevel: p.english_level || 'B2',
              skills: p.skills || [],
              stageId: newApp.stage_id,
              daysInStage: 0,
              isStuck: false,
            };
            setCandidates((prev) => [
              newKanbanItem,
              ...prev.filter((c) => c.applicationId !== newApp.id),
            ]);
          }
          loadOpeningData();
        }}
        onOpenCreateNew={() => setIsAddModalOpen(true)}
      />

      {/* Edit Opening Dialog */}
      <EditOpeningDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        opening={opening}
        onOpeningUpdated={() => loadOpeningData()}
      />

      {/* Delete Opening Confirmation Modal */}
      <DeleteOpeningModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        opening={
          opening
            ? {
                id: opening.id,
                title: opening.title,
                candidateCount: candidates.length,
              }
            : null
        }
        onDeleted={() => {
          router.push('/openings');
        }}
      />
    </div>
  );
}

export default function OpeningKanbanPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-slate-500">
          Loading opening pipeline...
        </div>
      }
    >
      <OpeningKanbanContent />
    </Suspense>
  );
}
