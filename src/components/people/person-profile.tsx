'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Person,
  Contract,
  Document,
  Review,
  CompensationRecord,
  Assignment,
  UserRole,
  ActivityLog,
} from '@/types/database';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { DataService } from '@/lib/data-service';
import { getSignedCVUrl } from '@/actions/documents';
import { addCandidateToOpening } from '@/actions/openings';
import { toast } from 'sonner';
import {
  FileText,
  Briefcase,
  DollarSign,
  ScrollText,
  Star,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  ExternalLink,
  Plus,
  Send,
  Calendar,
  Building,
  User,
  Fingerprint,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ActiveGateCeremony } from './active-gate-ceremony';
import { UploadCVDropzone } from './upload-cv-dropzone';
import { DeleteCandidateModal } from './delete-candidate-modal';
import { AddAssignmentDialog } from './add-assignment-dialog';
import { AddCompensationDialog } from './add-compensation-dialog';
import { UploadContractDialog } from './upload-contract-dialog';
import { RemoveFromPipelineModal } from '@/components/recruiting/remove-from-pipeline-modal';

interface PersonProfileProps {
  person: Person;
  onUpdatePersonStatus?: (newStatus: Person['status']) => void;
}

export function PersonProfile({ person, onUpdatePersonStatus }: PersonProfileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAdminOptIn } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'documents' | 'hiring' | 'assignments' | 'compensation' | 'contracts' | 'reviews' | 'activity'
  >('overview');

  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [isUploadContractOpen, setIsUploadContractOpen] = useState(false);
  const [candidateAppToRemove, setCandidateAppToRemove] = useState<{
    applicationId: string;
    openingTitle: string;
  } | null>(null);

  const [docs, setDocs] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [personAssignments, setPersonAssignments] = useState<Assignment[]>([]);
  const [personComp, setPersonComp] = useState<CompensationRecord[]>([]);
  const [personReviews, setPersonReviews] = useState<Review[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  const [signedUrlCountdown, setSignedUrlCountdown] = useState<{ [docId: string]: number }>({});
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  // Add to Opening state
  const [isAddOpeningModalOpen, setIsAddOpeningModalOpen] = useState(false);
  const [openingsList, setOpeningsList] = useState<any[]>([]);
  const [selectedOpeningIdToAdd, setSelectedOpeningIdToAdd] = useState('');
  const [isSubmittingOpening, setIsSubmittingOpening] = useState(false);

  const handleOpenAddOpening = async () => {
    try {
      const allOpenings = await DataService.getOpenings();
      const appliedIds = new Set(applications.map((a) => a.opening_id));
      const available = allOpenings.filter((o) => !appliedIds.has(o.id));
      setOpeningsList(available);
      if (available.length > 0) {
        setSelectedOpeningIdToAdd(available[0].id);
      }
      setIsAddOpeningModalOpen(true);
    } catch {
      toast.error('Failed to load openings.');
    }
  };

  const handleConfirmAddToOpening = async () => {
    if (!selectedOpeningIdToAdd) {
      toast.error('Please select an opening.');
      return;
    }
    setIsSubmittingOpening(true);
    try {
      const res = await addCandidateToOpening(person.id, selectedOpeningIdToAdd);
      if (res.success) {
        toast.success('Candidate successfully added to opening pipeline in Applied stage.');
        setIsAddOpeningModalOpen(false);
        loadData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }
      } else {
        toast.error(res.error || 'Failed to add candidate to opening.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred.');
    } finally {
      setIsSubmittingOpening(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await DataService.getPersonProfile(person.id);
      setDocs(data.documents);
      setContracts(data.contracts);
      setPersonAssignments(data.assignments);
      setPersonComp(data.compensation);
      setPersonReviews(data.reviews);
      setActivityLogs(data.activityLog);
      setApplications(data.applications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTalentSync = () => {
      loadData();
    };
    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
    };
  }, [person.id]);

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam) {
      if (tabParam === 'assignment' || tabParam === 'assignments') {
        setActiveTab('assignments');
      } else if (tabParam === 'compensation') {
        setActiveTab('compensation');
      } else if (tabParam === 'contract' || tabParam === 'contracts') {
        setActiveTab('contracts');
      } else if (
        ['overview', 'documents', 'hiring', 'reviews', 'activity'].includes(tabParam)
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const currentAssignment = personAssignments.find((a) => a.status === 'Active');
  const assignedClientName = (currentAssignment as any)?.clients?.name || null;

  const hasSignedContractor = contracts.some(
    (k) => k.type === 'contractor_agreement' && k.status === 'Signed'
  );
  const hasSignedNda = contracts.some((k) => k.type === 'nda' && k.status === 'Signed');
  const isGatePassed = hasSignedContractor && hasSignedNda;

  // RBAC
  const canSeeComp = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);
  const isOwnClient = false;
  const canSeeBillRate = Permissions.canViewBillRate(currentUser.role, isOwnClient, isAdminOptIn);
  const canSeeMargin = Permissions.canViewMargin(currentUser.role, isAdminOptIn);
  const canSeeContracts = Permissions.canViewContracts(currentUser.role, isOwnClient);
  const canManageAssignments = Permissions.canManageAssignments(currentUser.role, isOwnClient);
  const canManageCompensation = Permissions.canManageCompensation(currentUser.role);
  const canUploadContracts = Permissions.canUploadContracts(currentUser.role);
  const canEdit = Permissions.canEditCandidates(currentUser.role);
  const canAdd = Permissions.canAddCandidate(currentUser.role);
  const canDelete = Permissions.canDeleteCandidate(currentUser.role);

  // Real 60-second temporary signed URL generator
  const handleGenerateSignedUrl = async (docId: string, fileName: string, filePath: string) => {
    try {
      const res = await getSignedCVUrl(filePath, 60);

      if (res.success && res.signedUrl) {
        setSignedUrlCountdown((prev) => ({ ...prev, [docId]: 60 }));
        const interval = setInterval(() => {
          setSignedUrlCountdown((prev) => {
            const current = prev[docId];
            if (!current || current <= 1) {
              clearInterval(interval);
              const next = { ...prev };
              delete next[docId];
              return next;
            }
            return { ...prev, [docId]: current - 1 };
          });
        }, 1000);

        toast.success(`Signed URL generated for "${fileName}"`, {
          description: 'Valid for 60 seconds.',
        });

        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(res.error || 'Failed to generate signed download link.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error downloading document.');
    }
  };

  const handleSimulateSigning = (type: 'contractor_agreement' | 'nda') => {
    const newContract: Contract = {
      id: crypto.randomUUID(),
      person_id: person.id,
      type,
      status: 'Signed',
      signed_date: new Date().toISOString().slice(0, 10),
      start_date: new Date().toISOString().slice(0, 10),
      file_path: `contracts/${person.full_name.toLowerCase().replace(/\s+/g, '_')}_${type}.pdf`,
      file_name: `${person.full_name.toLowerCase().replace(/\s+/g, '_')}_${type}.pdf`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser.id,
    };
    setContracts((prev) => [newContract, ...prev]);
  };

  const handleActivationSuccess = () => {
    if (onUpdatePersonStatus) {
      onUpdatePersonStatus('active');
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const logItem: ActivityLog = {
      id: crypto.randomUUID(),
      entity_type: 'notes',
      entity_id: crypto.randomUUID(),
      person_id: person.id,
      actor_id: currentUser.id,
      action: 'add_note',
      diff: {},
      note: newNote,
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [logItem, ...prev]);
    setNewNote('');
    toast.success('Note added to audit log.');
  };

  const statusStyles: Record<Person['status'], { bg: string; text: string; border: string }> = {
    active: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    onboarding: { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/30' },
    bench: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
    candidate: { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30' },
    offboarded: { bg: 'bg-slate-700/10', text: 'text-slate-400', border: 'border-slate-600/30' },
    rejected: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/30' },
  };

  const curStyle = statusStyles[person.status] || statusStyles.candidate;

  return (
    <div className="space-y-6">
      {/* Profile Header (Single source of truth) */}
      <div className="p-6 sm:p-7 metallic-surface rounded-2xl border border-white/[0.12] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-100">{person.full_name}</h1>
              <span
                className={cn(
                  'text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border',
                  curStyle.bg,
                  curStyle.text,
                  curStyle.border
                )}
              >
                {person.status}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                {person.seniority}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300">
                English: {person.english_level}
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-3">
              <span>{person.email}</span>
              <span>&bull;</span>
              <span>{person.country}</span>
              <span>&bull;</span>
              <span>{person.timezone}</span>
            </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {person.skills && person.skills.length > 0 ? (
                  person.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#181d28] text-slate-200 border border-white/10"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Generalist</span>
                )}
              </div>
            </div>

          {/* Quick Actions & Signature Active Gate Launcher */}
          <div className="flex flex-wrap md:flex-col items-end gap-2.5">
            <div className="flex items-center gap-2">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all active:scale-95 cursor-pointer shadow-sm shadow-rose-500/10"
                  title="Delete Candidate"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              )}

              <button
                onClick={() => setIsCeremonyOpen(true)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer',
                  isGatePassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                    : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 shadow-cyan-500/20'
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isGatePassed ? 'Active Gate: Verified' : 'Active Gate Ceremony'}
                </span>
              </button>
            </div>

            {currentAssignment && (
              <div className="text-right text-xs bg-[#181d28] p-3 rounded-xl border border-white/10 shadow-inner">
                <div className="text-slate-400 text-[10px] font-mono uppercase font-bold">
                  Active Placement
                </div>
                <div className="font-bold text-slate-100 text-sm mt-0.5">{assignedClientName || 'Client Placed'}</div>
                <div className="text-slate-400 text-[11px] font-mono">{currentAssignment.role_title}</div>
              </div>
            )}
          </div>
        </div>

        {/* 8 Tabs Navigation */}
        <div className="flex items-center gap-1.5 border-t border-white/[0.08] mt-6 pt-3 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: '1. Overview', icon: FileText },
            { id: 'documents', label: '2. CV & Documents', icon: ScrollText },
            { id: 'hiring', label: '3. Hiring & Interviews', icon: Briefcase },
            { id: 'assignments', label: '4. Assignment', icon: Building },
            {
              id: 'compensation',
              label: '5. Compensation',
              icon: DollarSign,
              locked: !canSeeComp,
            },
            {
              id: 'contracts',
              label: '6. Contracts',
              icon: ShieldCheck,
              locked: !canSeeContracts,
            },
            { id: 'reviews', label: '7. Reviews & Trends', icon: Star },
            { id: 'activity', label: '8. Activity & Audit', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer',
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.locked && <Lock className="w-3 h-3 ml-0.5 opacity-60" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Status & Placement Summary Card */}
            <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Talent Placement Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#131620] rounded-xl border border-white/5">
                  <span className="text-slate-500 text-[10px] block">Current Status</span>
                  <span className="font-bold text-slate-100 text-sm uppercase mt-0.5 block">
                    {person.status}
                  </span>
                </div>
                <div className="p-3 bg-[#131620] rounded-xl border border-white/5">
                  <span className="text-slate-500 text-[10px] block">Salary Expectation</span>
                  <span className="font-bold text-teal-300 text-sm mt-0.5 block">
                    {person.salary_expectation
                      ? `${formatCurrency(person.salary_expectation)}/mo`
                      : 'Not specified'}
                  </span>
                </div>
                <div className="p-3 bg-[#131620] rounded-xl border border-white/5">
                  <span className="text-slate-500 text-[10px] block">Availability Date</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                    {person.availability_date ? formatDate(person.availability_date) : 'Immediate'}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Review Snapshot */}
            <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 tracking-tight">Monthly Performance Review</h3>
                {personReviews.length > 0 && (
                  <span
                    className={cn(
                      'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border',
                      personReviews[0].health === 'Green'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : personReviews[0].health === 'Red'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    )}
                  >
                    HEALTH: {personReviews[0].health}
                  </span>
                )}
              </div>

              {personReviews.length > 0 ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-black font-mono tracking-tight text-slate-100">
                      {personReviews[0].average_score?.toFixed(1) || '—'}
                      <span className="text-xs font-normal text-slate-400 font-sans"> / 5.0</span>
                    </div>
                    <div className="text-slate-400 text-xs font-mono">
                      <div>Period: {personReviews[0].period}</div>
                      <div>Status: {personReviews[0].status}</div>
                    </div>
                  </div>
                  {personReviews[0].client_feedback && (
                    <p className="italic text-slate-300 bg-[#131620] p-3.5 rounded-xl border border-white/5 leading-relaxed">
                      "{personReviews[0].client_feedback}"
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No monthly review scores submitted yet.</p>
              )}
            </div>
          </div>

          {/* Upcoming Dates & Milestones */}
          <div className="space-y-6">
            <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Key Milestones</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3.5 bg-[#131620] rounded-xl border border-white/5">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">Registered on Talent Hub</div>
                    <div className="text-slate-400 text-[11px] font-mono">{formatDate(person.created_at)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-[#131620] rounded-xl border border-white/5">
                  <ScrollText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">Contract Status</div>
                    {contracts.length > 0 ? (
                      <div className="text-cyan-300 font-mono text-[11px]">
                        {contracts.length} contract agreement{contracts.length === 1 ? '' : 's'} on file
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[11px]">No contracts on file</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CV and Documents (Signed URLs 60s) */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Explicit Upload CV Dropzone Component */}
          <UploadCVDropzone
            person={person}
            existingDocs={docs}
            onDocumentUploaded={(newDoc) => {
              setDocs((prev) => [newDoc, ...prev]);
              loadData();
            }}
          />

          <div className="flex items-center justify-between pt-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Full Personnel Document Vault</h3>
              <p className="text-xs text-slate-400">
                Encrypted Supabase storage. Download tokens expire automatically after 60 seconds.
              </p>
            </div>
          </div>

          <div className="metallic-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            {docs.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500">
                No documents uploaded yet for this candidate. Use the dropzone above to upload a CV.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-[#181d28] border-b border-white/10 text-slate-400 uppercase text-[10px] font-mono tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3 text-right">Signed URL Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {docs.map((doc) => {
                    const countdown = signedUrlCountdown[doc.id];
                    return (
                      <tr key={doc.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{doc.file_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="uppercase text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">
                          {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleGenerateSignedUrl(doc.id, doc.file_name, doc.file_path)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer',
                              countdown
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                                : 'bg-[#1a202c] hover:bg-[#222a3a] text-slate-200 border border-white/10 active:scale-95'
                            )}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {countdown ? `View/Download (${countdown}s)` : 'View CV (Signed URL)'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Hiring */}
      {activeTab === 'hiring' && (
        <div className="space-y-6">
          <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-tight">Applications &amp; Interview Pipelines</h3>
                <p className="text-xs text-slate-400">All job opening recruitment pipelines this person is currently or previously linked to.</p>
              </div>

              {canAdd && (
                <button
                  type="button"
                  onClick={handleOpenAddOpening}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add to Opening</span>
                </button>
              )}
            </div>

            {applications.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">No job opening applications recorded for this person.</p>
                {canAdd && (
                  <button
                    onClick={handleOpenAddOpening}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign to Opening Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => {
                  const stageName = app.pipeline_stages?.name || 'Applied';
                  const isRejected = stageName === 'Rejected';
                  const isHired = stageName === 'Hired';

                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl bg-[#131620] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-cyan-400/30 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/openings/${app.opening_id}`}
                            className="font-bold text-slate-200 hover:text-cyan-300 text-sm transition-colors flex items-center gap-1"
                          >
                            <span>{app.openings?.title || 'Job Opening'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </Link>
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                              isHired
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : isRejected
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                            )}
                          >
                            {stageName}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-2">
                          <span>Client: <strong className="text-slate-300">{app.openings?.clients?.name || 'Direct'}</strong></span>
                          <span>&bull;</span>
                          <span>Source: {app.source || 'Direct Candidate'}</span>
                          <span>&bull;</span>
                          <span>
                            Stage Updated:{' '}
                            <strong className="text-slate-300">
                              {formatDate(app.stage_changed_at || app.created_at)}
                            </strong>
                          </span>
                        </div>

                        {/* If Rejected: Show reason badge & notes */}
                        {isRejected && app.rejection_reason && (
                          <div className="mt-1 pt-1 border-t border-white/[0.05] text-[11px] text-rose-300 flex items-center gap-2 font-mono">
                            <span className="font-bold uppercase text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                              Rejection Reason: {app.rejection_reason}
                            </span>
                            {app.rejection_notes && (
                              <span className="text-slate-400 italic">"{app.rejection_notes}"</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/openings/${app.opening_id}`}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <span>Open Kanban</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              setCandidateAppToRemove({
                                applicationId: app.id,
                                openingTitle: app.openings?.title || 'Job Opening',
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            title="Remove candidate from this opening pipeline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add To Opening Modal */}
          {isAddOpeningModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-md bg-[#141822] border border-white/[0.14] rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-bold text-white">Add Candidate to Opening</h4>
                  </div>
                  <button
                    onClick={() => setIsAddOpeningModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    &times;
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Select an active opening to enroll <strong className="text-white">{person.full_name}</strong> into its Kanban pipeline under the <strong>Applied</strong> stage.
                </p>

                {openingsList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    No additional active openings available, or candidate is already linked to all existing openings.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200">Select Job / Project Opening</label>
                    <select
                      value={selectedOpeningIdToAdd}
                      onChange={(e) => setSelectedOpeningIdToAdd(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                    >
                      {openingsList.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.title} &bull; {(op as any).clients?.name || 'Client'} ({op.seniority})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsAddOpeningModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={openingsList.length === 0 || isSubmittingOpening}
                    onClick={handleConfirmAddToOpening}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 transition-all shadow-md shadow-cyan-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingOpening ? 'Submitting...' : 'Submit to Opening'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Assignment */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span>Assignment History</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Client project placements, billing terms, and active account managers.
                </p>
              </div>

              {canManageAssignments && (
                <button
                  type="button"
                  onClick={() => setIsAddAssignmentOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer shrink-0"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>+ Add Assignment</span>
                </button>
              )}
            </div>

            {personAssignments.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200">No client placement assignments on record</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No assignments yet. Assign this person to a client project.
                  </p>
                </div>
                {canManageAssignments && (
                  <button
                    type="button"
                    onClick={() => setIsAddAssignmentOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>+ Add Assignment</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {personAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl bg-[#131620] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-cyan-400/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">
                          {assignment.clients?.name || 'Client'}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border',
                            assignment.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-white/10'
                          )}
                        >
                          {assignment.status}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1 font-mono">
                        Role: <strong className="text-slate-300">{assignment.role_title}</strong> &bull; {assignment.hours_per_week}h/week
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono flex flex-wrap items-center gap-2 mt-0.5">
                        <span>
                          Period: {formatDate(assignment.start_date)} —{' '}
                          {assignment.end_date ? formatDate(assignment.end_date) : 'Present'}
                        </span>
                        {assignment.account_manager?.name && (
                          <>
                            <span>&bull;</span>
                            <span>AM: {assignment.account_manager.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {canSeeBillRate ? (
                        <div>
                          <div className="text-slate-400 text-[10px] font-mono uppercase font-bold">
                            Bill Rate
                          </div>
                          <div className="text-base font-bold font-mono text-cyan-300">
                            {formatCurrency(assignment.bill_rate, assignment.currency)} / {assignment.bill_rate_unit}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] italic">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Bill rate restricted</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Compensation (Restricted) */}
      {activeTab === 'compensation' && (
        <div className="space-y-6">
          {!canSeeComp ? (
            <div className="p-10 text-center metallic-surface rounded-2xl border border-dashed border-white/10 space-y-3">
              <Lock className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">Compensation Restricted</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Worker salary and compensation history are restricted to Admin and HR Manager roles.
              </p>
            </div>
          ) : (
            <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    <span>Salary History (Append-Only)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable historical compensation ledger for worker salary &amp; billing costs.
                  </p>
                </div>

                {canManageCompensation && (
                  <button
                    type="button"
                    onClick={() => setIsAddCompOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>+ Add Compensation Record</span>
                  </button>
                )}
              </div>

              {personComp.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">No formal compensation records logged yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No compensation records on file. Add salary or hourly rate.
                    </p>
                  </div>
                  {canManageCompensation && (
                    <button
                      type="button"
                      onClick={() => setIsAddCompOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>+ Add Compensation Record</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-[#131620]">
                  {personComp.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 hover:bg-white/[0.02] flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-sm font-mono text-teal-300">
                          {formatCurrency(comp.amount, comp.currency)} / {comp.frequency}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          Effective: {formatDate(comp.effective_date)} &bull; Reason:{' '}
                          <span className="capitalize font-semibold text-slate-200">{comp.reason}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                        {comp.engagement_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Contracts (Restricted) */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          {!canSeeContracts ? (
            <div className="p-10 text-center metallic-surface rounded-2xl border border-dashed border-white/10 space-y-3">
              <Lock className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-200">Contracts Restricted</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Legal contracts are restricted to Admin, HR Lead, and assigned client account managers.
              </p>
            </div>
          ) : (
            <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Signed Agreements &amp; NDA</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bilateral contractor agreements, mutual NDAs, and client SOW scopes.
                  </p>
                </div>

                {canUploadContracts && (
                  <button
                    type="button"
                    onClick={() => setIsUploadContractOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>+ Upload Contract</span>
                  </button>
                )}
              </div>

              {contracts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">No contract agreements uploaded yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No contracts uploaded. Upload signed NDA or Contractor Agreement.
                    </p>
                  </div>
                  {canUploadContracts && (
                    <button
                      type="button"
                      onClick={() => setIsUploadContractOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>+ Upload Contract</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="p-4 rounded-xl bg-[#131620] border border-white/5 flex items-center justify-between gap-4 hover:border-cyan-400/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck
                          className={cn(
                            'w-5 h-5',
                            contract.status === 'Signed' ? 'text-emerald-400' : 'text-amber-400'
                          )}
                        />
                        <div>
                          <div className="font-bold text-slate-100 text-sm">
                            {contract.type.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            File: {contract.file_name} &bull; Start: {formatDate(contract.start_date)}
                            {contract.end_date && ` &bull; End: ${formatDate(contract.end_date)}`}
                            {contract.signed_date && ` &bull; Signed: ${formatDate(contract.signed_date)}`}
                          </div>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border',
                          contract.status === 'Signed'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        )}
                      >
                        {contract.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">Performance Review History</h3>
            {personReviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No monthly review records submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {personReviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl bg-[#131620] border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Period: {r.period}</span>
                      <span className="font-mono font-bold text-cyan-300">Score: {r.average_score?.toFixed(1) || '—'} / 5.0</span>
                    </div>
                    {r.client_feedback && (
                      <p className="italic text-slate-400 bg-black/20 p-2.5 rounded-lg border border-white/5">
                        "{r.client_feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 8: Activity & Audit */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="p-5 metallic-surface rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Audit Trail Ledger</h3>
              <span className="text-[10px] font-mono text-slate-400">{activityLogs.length} events</span>
            </div>

            {/* Quick Note Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Append an audit note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 h-9 px-3.5 rounded-xl bg-[#131620] border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
              />
              <button
                onClick={handleAddNote}
                className="h-9 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                Post
              </button>
            </div>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No activity logs recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#131620] border border-white/5 flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {log.action}
                        </span>
                        <span>{log.note || 'Audit event logged'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Timestamp: {formatDate(log.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Gate Ceremony Modal */}
      <ActiveGateCeremony
        person={person}
        contracts={contracts}
        isOpen={isCeremonyOpen}
        onClose={() => setIsCeremonyOpen(false)}
        onActivateSuccess={handleActivationSuccess}
      />

      {/* Delete Candidate Confirmation Modal */}
      <DeleteCandidateModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        person={person}
        hasAssignments={personAssignments.length > 0}
        hasContracts={contracts.length > 0}
        onDeleted={() => {
          router.push('/people');
        }}
      />

      {/* Add Assignment Dialog */}
      <AddAssignmentDialog
        isOpen={isAddAssignmentOpen}
        onClose={() => setIsAddAssignmentOpen(false)}
        personId={person.id}
        personName={person.full_name}
        onAssignmentAdded={() => loadData()}
      />

      {/* Add Compensation Dialog */}
      <AddCompensationDialog
        isOpen={isAddCompOpen}
        onClose={() => setIsAddCompOpen(false)}
        personId={person.id}
        personName={person.full_name}
        defaultCurrency={person.salary_currency || 'USD'}
        onCompensationAdded={() => loadData()}
      />

      {/* Upload Contract Dialog */}
      <UploadContractDialog
        isOpen={isUploadContractOpen}
        onClose={() => setIsUploadContractOpen(false)}
        personId={person.id}
        personName={person.full_name}
        onContractUploaded={() => loadData()}
      />

      {/* Remove from Pipeline Modal */}
      {candidateAppToRemove && (
        <RemoveFromPipelineModal
          isOpen={true}
          candidateName={person.full_name}
          openingTitle={candidateAppToRemove.openingTitle}
          applicationId={candidateAppToRemove.applicationId}
          onClose={() => setCandidateAppToRemove(null)}
          onRemoved={() => {
            setApplications((prev) =>
              prev.filter((a) => a.id !== candidateAppToRemove.applicationId)
            );
            loadData();
          }}
        />
      )}
    </div>
  );
}
