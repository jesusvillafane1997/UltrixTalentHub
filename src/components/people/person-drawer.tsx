'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { WorkforceMember, Contract, Assignment, Person } from '@/types/database';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  Clock,
  Download,
  Calendar,
  Lock,
  Star,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

interface PersonDrawerProps {
  personId: string | null;
  onClose: () => void;
  onOpenActiveGateCeremony: (person: Person) => void;
}

export function PersonDrawer({
  personId,
  onClose,
  onOpenActiveGateCeremony,
}: PersonDrawerProps) {
  const { currentUser, isAdminOptIn } = useAuth();
  const [profileData, setProfileData] = useState<{
    person: Person | null;
    contracts: Contract[];
    assignments: Assignment[];
  }>({ person: null, contracts: [], assignments: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personId) {
      setProfileData({ person: null, contracts: [], assignments: [] });
      return;
    }

    let isMounted = true;
    setLoading(true);

    DataService.getPersonProfile(personId).then((res) => {
      if (isMounted) {
        setProfileData({
          person: res.person,
          contracts: res.contracts,
          assignments: res.assignments,
        });
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [personId]);

  if (!personId) return null;

  const { person, contracts, assignments } = profileData;
  const activeAssignment = assignments.find((a) => a.status === 'Active');

  const hasSignedContractor = contracts.some(
    (k) => k.type === 'contractor_agreement' && k.status === 'Signed'
  );
  const hasSignedNda = contracts.some((k) => k.type === 'nda' && k.status === 'Signed');
  const isGatePassed = hasSignedContractor && hasSignedNda;

  const canSeeSalary = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);
  const isOwnClient = false;
  const canSeeBillRate = Permissions.canViewBillRate(currentUser.role, isOwnClient, isAdminOptIn);
  const canSeeMargin = Permissions.canViewMargin(currentUser.role, isAdminOptIn);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-[#141822]/98 border-l border-white/[0.12] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 metallic-surface"
        >
          {loading || !person ? (
            <div className="flex-1 flex items-center justify-center py-20 text-xs font-mono text-slate-400">
              <span>Loading talent profile telemetry...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/[0.1]">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{person.full_name}</h3>
                  <p className="text-xs font-mono text-slate-400">
                    {person.country} &bull; {person.timezone}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Gate Compliance Status Pill */}
              <div
                className={cn(
                  'p-4 rounded-xl border flex items-center justify-between',
                  isGatePassed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                )}
              >
                <div className="flex items-center gap-3">
                  {isGatePassed ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider font-mono">
                      Active Gate Protocol:{' '}
                      {isGatePassed ? 'Fully Verified' : 'Compliance Incomplete'}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {isGatePassed
                        ? 'Signed Contractor Agreement and NDA verified on file.'
                        : 'Missing signed contractor agreement or NDA. Payroll activation locked.'}
                    </div>
                  </div>
                </div>

                {!isGatePassed && person.status === 'onboarding' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenActiveGateCeremony(person);
                    }}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer"
                  >
                    Verify Gate
                  </button>
                )}
              </div>

              {/* Status and Seniority Badges */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#181d28] border border-white/[0.08]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Status</span>
                  <span className="font-bold text-slate-200 uppercase font-mono mt-0.5 block">
                    {person.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#181d28] border border-white/[0.08]">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Seniority &amp; English</span>
                  <span className="font-bold text-slate-200 font-mono mt-0.5 block">
                    {person.seniority} &bull; {person.english_level}
                  </span>
                </div>
              </div>

              {/* Skills Tag Cloud */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Technical Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {person.skills && person.skills.length > 0 ? (
                    person.skills.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-slate-300"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Generalist</span>
                  )}
                </div>
              </div>

              {/* Active Placement Overview */}
              <div className="p-4 rounded-xl bg-[#161a24] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase font-mono">
                    Placement Assignment
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {activeAssignment ? 'Active Placement' : 'Bench / Candidate'}
                  </span>
                </div>

                {activeAssignment ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Role Title:</span>
                      <span className="font-bold text-slate-200">{activeAssignment.role_title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Start Date:</span>
                      <span className="font-mono text-slate-300">
                        {formatDate(activeAssignment.start_date)}
                      </span>
                    </div>
                    {canSeeBillRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Monthly Bill Rate:</span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatCurrency(activeAssignment.bill_rate, activeAssignment.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    No active client placement assigned.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Action to Open Full Profile */}
          {person && (
            <div className="pt-4 border-t border-white/[0.1] flex items-center justify-between gap-3">
              <Link
                href={`/people/${person.id}`}
                className="w-full h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
              >
                <span>View Complete Profile &amp; Documents</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
