'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { addCompensationRecord } from '@/actions/compensation';
import { CompReason, EngagementType, RateFrequency } from '@/types/database';
import {
  DollarSign,
  Calendar,
  Layers,
  FileCheck2,
  X,
  Loader2,
  TrendingUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddCompensationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  defaultCurrency?: string;
  onCompensationAdded?: (compensation: any) => void;
}

export function AddCompensationDialog({
  isOpen,
  onClose,
  personId,
  personName,
  defaultCurrency = 'USD',
  onCompensationAdded,
}: AddCompensationDialogProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [frequency, setFrequency] = useState<RateFrequency>('monthly');
  const [engagementType, setEngagementType] = useState<EngagementType>('contractor');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<CompReason>('hire');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid compensation amount greater than 0.');
      return;
    }
    if (!effectiveDate) {
      toast.error('Effective date is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await addCompensationRecord({
        person_id: personId,
        amount: parsedAmount,
        currency,
        frequency,
        engagement_type: engagementType,
        effective_date: effectiveDate,
        reason,
      });

      if (res.success) {
        toast.success(`Compensation record logged for ${personName}!`, {
          description: `${currency} ${parsedAmount.toLocaleString()} / ${frequency} (${reason})`,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        if (onCompensationAdded) {
          onCompensationAdded(res.compensation);
        }

        onClose();
      } else {
        toast.error(res.error || 'Failed to add compensation record.');
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
          className="relative w-full max-w-lg bg-[#141824] border border-white/[0.14] rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Record Salary / Rate</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Append-only compensation ledger for <span className="text-slate-200 font-semibold">{personName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                  <span>Compensation Amount *</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 4500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="ARS">ARS ($)</option>
                  <option value="BRL">BRL (R$)</option>
                </select>
              </div>
            </div>

            {/* Frequency & Engagement Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Payment Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RateFrequency)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer font-mono"
                >
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Engagement Type</label>
                <select
                  value={engagementType}
                  onChange={(e) => setEngagementType(e.target.value as EngagementType)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer font-mono"
                >
                  <option value="contractor">Contractor (B2B)</option>
                  <option value="employee">Employee (Direct)</option>
                </select>
              </div>
            </div>

            {/* Effective Date & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Effective Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                  <span>Change Reason</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as CompReason)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
                >
                  <option value="hire">Initial Hire Rate</option>
                  <option value="raise">Performance Raise</option>
                  <option value="adjustment">Market Adjustment</option>
                  <option value="promotion">Role Promotion</option>
                </select>
              </div>
            </div>

            {/* Append-Only Notice */}
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-start gap-2 text-[11px] font-mono leading-relaxed">
              <Info className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
              <span>
                <strong>Strictly Append-Only:</strong> Existing records are immutable for compliance and margin history. This new entry will become the active compensation baseline starting on {effectiveDate}.
              </span>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 flex items-center gap-2 transition-all shadow-md shadow-teal-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Record...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Log Compensation</span>
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
