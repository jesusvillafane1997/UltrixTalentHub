'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createAssignment } from '@/actions/assignments';
import { DataService } from '@/lib/data-service';
import { Client, User, AssignmentStatus, RateFrequency } from '@/types/database';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  onAssignmentAdded?: (assignment: any) => void;
}

export function AddAssignmentDialog({
  isOpen,
  onClose,
  personId,
  personName,
  onAssignmentAdded,
}: AddAssignmentDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [accountManagers, setAccountManagers] = useState<User[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [billRate, setBillRate] = useState('');
  const [billRateUnit, setBillRateUnit] = useState<RateFrequency>('monthly');
  const [currency, setCurrency] = useState('USD');
  const [accountManagerId, setAccountManagerId] = useState('');
  const [status, setStatus] = useState<AssignmentStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingOptions(true);

    Promise.all([DataService.getClients(), DataService.getUsers()])
      .then(([allClients, allUsers]) => {
        if (!isMounted) return;
        setClients(allClients || []);
        if (allClients && allClients.length > 0 && !clientId) {
          setClientId(allClients[0].id);
        }

        const ams = (allUsers || []).filter(
          (u) => u.role === 'account_manager' || u.role === 'admin'
        );
        setAccountManagers(ams);
        if (ams.length > 0 && !accountManagerId) {
          setAccountManagerId(ams[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load clients/AMs for assignment modal:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingOptions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error('Please select a client.');
      return;
    }
    if (!roleTitle.trim()) {
      toast.error('Role title is required.');
      return;
    }
    if (!startDate) {
      toast.error('Start date is required.');
      return;
    }
    const parsedBillRate = parseFloat(billRate);
    if (isNaN(parsedBillRate) || parsedBillRate < 0) {
      toast.error('Please enter a valid bill rate (0 or higher).');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createAssignment({
        person_id: personId,
        client_id: clientId,
        role_title: roleTitle.trim(),
        start_date: startDate,
        end_date: endDate.trim() || null,
        hours_per_week: parseFloat(hoursPerWeek) || 40,
        bill_rate: parsedBillRate,
        bill_rate_unit: billRateUnit,
        currency,
        account_manager_id: accountManagerId || null,
        status,
      });

      if (res.success) {
        toast.success(`Assignment created for ${personName}!`, {
          description: `Assigned to client as ${roleTitle.trim()}.`,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        if (onAssignmentAdded) {
          onAssignmentAdded(res.assignment);
        }

        onClose();
      } else {
        toast.error(res.error || 'Failed to create assignment.');
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
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#141824] border border-white/[0.14] rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Add Client Assignment</h3>
                <p className="text-xs text-slate-400 font-mono">
                  New placement for <span className="text-slate-200 font-semibold">{personName}</span>
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

          {loadingOptions ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-mono">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span>Loading clients & account managers...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Client & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Client Company *</span>
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                  >
                    {clients.length === 0 ? (
                      <option value="">No clients found</option>
                    ) : (
                      clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Role Title *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Start Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>End Date (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                  />
                </div>
              </div>

              {/* Bill Rate & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                    <span>Bill Rate *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 6500"
                    value={billRate}
                    onChange={(e) => setBillRate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Rate Unit</label>
                  <select
                    value={billRateUnit}
                    onChange={(e) => setBillRateUnit(e.target.value as RateFrequency)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ARS">ARS ($)</option>
                    <option value="BRL">BRL (R$)</option>
                  </select>
                </div>
              </div>

              {/* Hours / Week, Account Manager, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hours / Week</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Account Manager</span>
                  </label>
                  <select
                    value={accountManagerId}
                    onChange={(e) => setAccountManagerId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {accountManagers.map((am) => (
                      <option key={am.id} value={am.id}>
                        {am.name} ({am.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                  >
                    <option value="Active">Active</option>
                    <option value="Ended">Ended</option>
                  </select>
                </div>
              </div>

              {/* Status Note Banner */}
              {status === 'Active' && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-2 text-[11px] font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>
                    Setting status to <strong>Active</strong> will transition the talent's status to <strong>active</strong> in the Workforce Master.
                  </span>
                </div>
              )}

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
                  disabled={isSubmitting || clients.length === 0}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-2 transition-all shadow-md shadow-cyan-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Placement...</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Create Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
