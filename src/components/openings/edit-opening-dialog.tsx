'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { updateOpening } from '@/actions/openings';
import { Opening, SeniorityLevel, OpeningStatus, User } from '@/types/database';
import {
  X,
  Briefcase,
  Building2,
  DollarSign,
  Users,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Layers,
  Loader2,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditOpeningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opening: Opening;
  onOpeningUpdated?: () => void;
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
  'Ruby on Rails',
  'Flutter',
];

const SENIORITY_LEVELS: SeniorityLevel[] = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];

export function EditOpeningDialog({
  isOpen,
  onClose,
  opening,
  onOpeningUpdated,
}: EditOpeningDialogProps) {
  const { currentUser, isAdminOptIn } = useAuth();
  const canSeeComp = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);

  // Form State
  const [title, setTitle] = useState(opening.title || '');
  const [seniority, setSeniority] = useState<SeniorityLevel>(opening.seniority || 'Senior');
  const [stack, setStack] = useState<string[]>(opening.stack || []);
  const [stackInput, setStackInput] = useState('');
  const [headcount, setHeadcount] = useState(opening.headcount || 1);
  const [status, setStatus] = useState<OpeningStatus>(opening.status || 'Open');
  const [salaryMin, setSalaryMin] = useState(
    opening.salary_min != null ? String(opening.salary_min) : ''
  );
  const [salaryMax, setSalaryMax] = useState(
    opening.salary_max != null ? String(opening.salary_max) : ''
  );
  const [billRateMin, setBillRateMin] = useState(
    opening.bill_rate_min != null ? String(opening.bill_rate_min) : ''
  );
  const [billRateMax, setBillRateMax] = useState(
    opening.bill_rate_max != null ? String(opening.bill_rate_max) : ''
  );
  const [ownerId, setOwnerId] = useState(opening.owner_id || '');

  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(opening.title || '');
      setSeniority(opening.seniority || 'Senior');
      setStack(opening.stack || []);
      setHeadcount(opening.headcount || 1);
      setStatus(opening.status || 'Open');
      setSalaryMin(opening.salary_min != null ? String(opening.salary_min) : '');
      setSalaryMax(opening.salary_max != null ? String(opening.salary_max) : '');
      setBillRateMin(opening.bill_rate_min != null ? String(opening.bill_rate_min) : '');
      setBillRateMax(opening.bill_rate_max != null ? String(opening.bill_rate_max) : '');
      setOwnerId(opening.owner_id || '');

      DataService.getUsers().then((usrs) => {
        setStaffUsers(usrs);
      });
    }
  }, [isOpen, opening]);

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
      toast.error('Opening title is required.');
      return;
    }

    try {
      setIsSubmitting(true);

      const updates: Partial<Opening> = {
        title: title.trim(),
        seniority,
        status,
        headcount: Number(headcount) || 1,
        stack,
        owner_id: ownerId || null,
        salary_min: salaryMin ? parseFloat(salaryMin) : null,
        salary_max: salaryMax ? parseFloat(salaryMax) : null,
        bill_rate_min: billRateMin ? parseFloat(billRateMin) : null,
        bill_rate_max: billRateMax ? parseFloat(billRateMax) : null,
      };

      const res = await updateOpening(opening.id, updates);

      if (res.success) {
        toast.success(`Opening "${title}" updated successfully.`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }
        if (onOpeningUpdated) {
          onOpeningUpdated();
        }
        onClose();
      } else {
        toast.error(res.error || 'Failed to update opening.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
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
          onClick={isSubmitting ? undefined : onClose}
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
          {/* Top Specular Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161b26]/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Edit Job Opening</h2>
                <p className="text-xs text-slate-400">
                  Update requisition criteria, status, and target capacity.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
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
                placeholder="e.g., Senior Full Stack Dev"
                className="w-full h-10 px-3.5 rounded-xl bg-[#131620] border border-white/[0.12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* 2. Seniority, Headcount & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Seniority Level</label>
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
                <label className="text-xs font-bold text-slate-200">Requisition Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OpeningStatus)}
                  className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="Open">Open (Active)</option>
                  <option value="On hold">On hold</option>
                  <option value="Filled">Filled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Target Headcount</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={headcount}
                  onChange={(e) => setHeadcount(parseInt(e.target.value) || 1)}
                  className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* 3. Owner Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Opening Lead / Owner</span>
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-[#131620] border border-white/[0.12] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="">— Unassigned Owner —</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Tech Stack Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Required Skills & Tech Stack</span>
              </label>

              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#131620] border border-white/[0.12] min-h-[42px] items-center">
                {stack.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStackItem(item)}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  placeholder="Type tech and press Enter..."
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddStackItem(stackInput);
                    }
                  }}
                  className="bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none flex-1 min-w-[140px] px-1"
                />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono text-slate-500">Popular:</span>
                {COMMON_TECH_STACK.filter((s) => !stack.includes(s))
                  .slice(0, 6)
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleAddStackItem(item)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/5 transition-colors cursor-pointer"
                    >
                      + {item}
                    </button>
                  ))}
              </div>
            </div>

            {/* 5. Compensation & Bill Rates (Privileged) */}
            {canSeeComp && (
              <div className="p-4 rounded-xl bg-[#171b26] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                    <span>Compensation & Rate Boundaries (Monthly USD)</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    Restricted Access
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Target Salary Min</label>
                    <input
                      type="number"
                      step="100"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="e.g., 4000"
                      className="w-full h-8 px-3 rounded-lg bg-[#131620] border border-white/[0.12] text-xs text-slate-100 font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Target Salary Max</label>
                    <input
                      type="number"
                      step="100"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="e.g., 6000"
                      className="w-full h-8 px-3 rounded-lg bg-[#131620] border border-white/[0.12] text-xs text-slate-100 font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Bill Rate Min</label>
                    <input
                      type="number"
                      step="100"
                      value={billRateMin}
                      onChange={(e) => setBillRateMin(e.target.value)}
                      placeholder="e.g., 7000"
                      className="w-full h-8 px-3 rounded-lg bg-[#131620] border border-white/[0.12] text-xs text-slate-100 font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400">Bill Rate Max</label>
                    <input
                      type="number"
                      step="100"
                      value={billRateMax}
                      onChange={(e) => setBillRateMax(e.target.value)}
                      placeholder="e.g., 9500"
                      className="w-full h-8 px-3 rounded-lg bg-[#131620] border border-white/[0.12] text-xs text-slate-100 font-mono mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
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
