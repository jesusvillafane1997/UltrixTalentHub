'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { createOpening } from '@/actions/openings';
import { Client, User, SeniorityLevel, OpeningStatus } from '@/types/database';
import {
  X,
  Briefcase,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateOpeningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpeningCreated?: (openingId: string) => void;
}

const COMMON_TECH_STACK = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Python',
  'AWS',
  'Docker',
  'Kubernetes',
  'GraphQL',
  'Tailwind CSS',
  'Go',
  'Java',
  'Spring Boot',
  'Ruby on Rails',
  'Flutter',
];

const SENIORITY_LEVELS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];

export function CreateOpeningDialog({ isOpen, onClose, onOpeningCreated }: CreateOpeningDialogProps) {
  const router = useRouter();
  const { currentUser, isAdminOptIn } = useAuth();
  const canSeeComp = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);

  // Form State
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [isQuickClient, setIsQuickClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [clientTimezone, setClientTimezone] = useState('America/New_York (EST)');
  const [seniority, setSeniority] = useState<SeniorityLevel>('Senior');
  const [stack, setStack] = useState<string[]>(['React', 'TypeScript', 'Node.js']);
  const [stackInput, setStackInput] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [status, setStatus] = useState<OpeningStatus>('Open');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [billRateMin, setBillRateMin] = useState('');
  const [billRateMax, setBillRateMax] = useState('');
  const [ownerId, setOwnerId] = useState('');

  // Dropdown lists
  const [clients, setClients] = useState<Client[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([DataService.getClients(), DataService.getUsers()]).then(([cl, usr]) => {
      if (isMounted) {
        setClients(cl);
        setStaffUsers(usr);
        if (cl.length > 0 && !clientId) {
          setClientId(cl[0].id);
        } else if (cl.length === 0) {
          setIsQuickClient(true);
        }
        if (usr.length > 0 && !ownerId) {
          setOwnerId(currentUser.id || usr[0].id);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentUser.id, clientId, ownerId]);

  if (!isOpen) return null;

  const handleAddStackItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !stack.includes(trimmed)) {
      setStack((prev) => [...prev, trimmed]);
    }
    setStackInput('');
  };

  const handleRemoveStackItem = (itemToRemove: string) => {
    setStack((prev) => prev.filter((s) => s !== itemToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a job or project title.');
      return;
    }

    if (isQuickClient && !quickClientName.trim()) {
      toast.error('Please provide a client name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('actor_id', currentUser.id);
      formData.append('actor_role', currentUser.role);
      formData.append('title', title.trim());

      if (isQuickClient) {
        formData.append('client_id', 'new');
        formData.append('quick_client_name', quickClientName.trim());
        formData.append('client_timezone', clientTimezone);
      } else {
        formData.append('client_id', clientId);
      }

      formData.append('seniority', seniority);
      formData.append('headcount', headcount.toString());
      formData.append('status', status);
      formData.append('stack', JSON.stringify(stack));
      formData.append('owner_id', ownerId || currentUser.id);

      if (salaryMin.trim()) formData.append('salary_min', salaryMin.trim());
      if (salaryMax.trim()) formData.append('salary_max', salaryMax.trim());
      if (billRateMin.trim()) formData.append('bill_rate_min', billRateMin.trim());
      if (billRateMax.trim()) formData.append('bill_rate_max', billRateMax.trim());

      const result = await createOpening(formData);

      if (result.success && result.openingId) {
        toast.success(`Opening "${title}" created successfully!`, {
          description: 'Navigating to dedicated recruitment pipeline.',
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        if (onOpeningCreated) {
          onOpeningCreated(result.openingId);
        }

        onClose();
        router.push(`/openings/${result.openingId}`);
      } else {
        toast.error(result.error || 'Failed to create opening.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#141822] border border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden z-10 my-8"
        >
          {/* Top Titanium Specular Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161b26]/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Create Job / Project Opening</h2>
                <p className="text-xs text-slate-400">
                  Define opening criteria, client assignment, and hire headcount.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
            {/* 1. Job Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Job / Project Title</span>
                <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Full Stack Dev, Mobile Tech Lead"
                className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* 2. Client Selection or Quick Creation */}
            <div className="space-y-2 rounded-xl bg-[#171b26] p-4 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Client Account</span>
                  <span className="text-cyan-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickClient(!isQuickClient)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  {isQuickClient ? 'Select Existing Client' : '+ Add Quick Client'}
                </button>
              </div>

              {isQuickClient ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Client Name</label>
                    <input
                      type="text"
                      required={isQuickClient}
                      value={quickClientName}
                      onChange={(e) => setQuickClientName(e.target.value)}
                      placeholder="e.g., Acme Corp"
                      className="w-full h-9 px-3 rounded-lg bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Timezone</label>
                    <select
                      value={clientTimezone}
                      onChange={(e) => setClientTimezone(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 mt-1 cursor-pointer"
                    >
                      <option value="America/New_York (EST)">America/New_York (EST)</option>
                      <option value="America/Chicago (CST)">America/Chicago (CST)</option>
                      <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                      <option value="America/Argentina/Buenos_Aires (ART)">America/Buenos_Aires (ART)</option>
                      <option value="America/Bogota (COT)">America/Bogota (COT)</option>
                      <option value="UTC">UTC / Remote</option>
                    </select>
                  </div>
                </div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsQuickClient(true);
                    } else {
                      setClientId(e.target.value);
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  {clients.length === 0 && <option value="new">+ Quick Add New Client (None Recorded)</option>}
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} &bull; {c.timezone}
                    </option>
                  ))}
                  {clients.length > 0 && <option value="new">+ Add New Client Account...</option>}
                </select>
              )}
            </div>

            {/* 3. Seniority, Headcount & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Seniority</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                  className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  {SENIORITY_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Headcount Needed</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={headcount}
                  onChange={(e) => setHeadcount(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OpeningStatus)}
                  className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="On hold">On hold</option>
                  <option value="Filled">Filled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* 4. Tech Stack Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Required Tech Stack</span>
                <span className="text-[10px] font-mono text-slate-500">{stack.length} technologies chosen</span>
              </label>

              {/* Active Stack Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-[#131620] border border-white/[0.12]">
                {stack.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStackItem(item)}
                      className="hover:text-rose-400 transition-colors ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {stack.length === 0 && (
                  <span className="text-xs text-slate-500 italic py-0.5">Click tags below or type to add tech...</span>
                )}
              </div>

              {/* Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStackItem(stackInput);
                    }
                  }}
                  placeholder="Type skill & press Enter..."
                  className="flex-1 h-8 px-3 rounded-lg bg-[#161b26] border border-white/[0.1] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddStackItem(stackInput)}
                  className="px-3 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Common Suggestions */}
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_TECH_STACK.filter((s) => !stack.includes(s))
                  .slice(0, 8)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddStackItem(s)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            {/* 5. Compensation & Bill Rate Ranges (Permission Controlled) */}
            {canSeeComp && (
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                  <span>Financials & Rates (USD / Month)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#171b26] border border-white/[0.08]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Candidate Target Salary (Min - Max)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min (e.g. 4500)"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#131620] border border-white/[0.1] text-xs text-slate-100"
                      />
                      <span className="text-slate-600">-</span>
                      <input
                        type="number"
                        placeholder="Max (e.g. 6000)"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#131620] border border-white/[0.1] text-xs text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Client Bill Rate (Min - Max)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min (e.g. 8000)"
                        value={billRateMin}
                        onChange={(e) => setBillRateMin(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#131620] border border-white/[0.1] text-xs text-slate-100"
                      />
                      <span className="text-slate-600">-</span>
                      <input
                        type="number"
                        placeholder="Max (e.g. 10000)"
                        value={billRateMax}
                        onChange={(e) => setBillRateMax(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#131620] border border-white/[0.1] text-xs text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Recruitment Lead / Owner */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Assigned Recruiter / Account Owner</span>
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Form Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Creating Opening...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Opening &amp; View Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
