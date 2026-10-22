'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Person, Contract } from '@/types/database';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  FileWarning,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  X,
  FileText,
  Upload,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface ActiveGateCeremonyProps {
  person: Person;
  contracts: Contract[];
  isOpen: boolean;
  onClose: () => void;
  onActivateSuccess: () => void;
  onSimulateSigning?: (type: 'contractor_agreement' | 'nda') => void;
}

export function ActiveGateCeremony({
  person,
  contracts,
  isOpen,
  onClose,
  onActivateSuccess,
  onSimulateSigning,
}: ActiveGateCeremonyProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const hasSignedContractor = contracts.some(
    (k) => k.type === 'contractor_agreement' && k.status === 'Signed'
  );
  const hasSignedNda = contracts.some((k) => k.type === 'nda' && k.status === 'Signed');
  const canActivate = hasSignedContractor && hasSignedNda;

  const verificationPoints = [
    {
      title: 'Contractor Agreement (MSA)',
      subtitle: 'Bilateral service agreement with Ultrix Digital LLC',
      status: hasSignedContractor ? 'verified' : 'missing',
      type: 'contractor_agreement' as const,
      docName: contracts.find((k) => k.type === 'contractor_agreement')?.file_name || 'Missing Agreement',
      date: contracts.find((k) => k.type === 'contractor_agreement')?.signed_date,
    },
    {
      title: 'Mutual Non-Disclosure Agreement (NDA)',
      subtitle: 'Client proprietary IP protection & security clauses',
      status: hasSignedNda ? 'verified' : 'missing',
      type: 'nda' as const,
      docName: contracts.find((k) => k.type === 'nda')?.file_name || 'Missing NDA',
      date: contracts.find((k) => k.type === 'nda')?.signed_date,
    },
    {
      title: 'Identity & Tax Verification',
      subtitle: 'Government ID on file & cross-border contractor tax forms',
      status: 'verified',
      docName: 'verified_dni_pass.pdf',
      date: '2026-10-15',
    },
    {
      title: 'Billing Currency & SOW Alignment',
      subtitle: `Rate indexed in ${person.salary_currency || 'USD'} with client terms matching`,
      status: 'verified',
      docName: 'sow_schedule_a.pdf',
      date: '2026-10-18',
    },
  ];

  const handleRunActivationCeremony = async () => {
    if (!canActivate) return;

    setIsVerifying(true);
    setVerifyStep(1);

    await new Promise((r) => setTimeout(r, 600));
    setVerifyStep(2);
    await new Promise((r) => setTimeout(r, 600));
    setVerifyStep(3);
    await new Promise((r) => setTimeout(r, 600));
    setVerifyStep(4);
    await new Promise((r) => setTimeout(r, 400));

    setIsVerifying(false);
    setIsComplete(true);

    // Fire explosive neon confetti
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#14b8a6', '#38bdf8', '#f59e0b', '#ffffff'],
    });

    onActivateSuccess();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'relative w-full max-w-xl overflow-hidden rounded-2xl bg-[#141824]/95 border border-white/[0.14] shadow-2xl backdrop-blur-2xl transition-all',
            isVerifying ? 'neon-cyan-signature' : ''
          )}
        >
          {/* Ambient top neon laser sheen */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-400 shadow-[0_0_12px_rgba(0,240,255,0.7)]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Identity */}
            <div className="flex items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-[0_0_6px_rgba(0,240,255,0.2)]">
                    ACTIVE GATE PROTOCOL
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {person.id.slice(0, 8)}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
                  {person.full_name}
                </h2>
                <p className="text-xs text-slate-400">
                  {person.seniority} • {person.country} • Target Status: <strong className="text-cyan-300 font-semibold">ACTIVE PLACEMENT</strong>
                </p>
              </div>
            </div>

            {/* Status Summary Banner */}
            {canActivate ? (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-between text-xs shadow-[0_0_12px_rgba(0,240,255,0.15)]"
              >
                <div className="flex items-center gap-2.5 text-cyan-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>All legal agreements verified on record. Ready for operational clearance.</span>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  READY
                </span>
              </motion.div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                <div className="flex items-center gap-2.5 text-amber-300 font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Gate Blocked: Cannot transition to Active without signed agreements on file.</span>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GATE LOCKED
                </span>
              </div>
            )}

            {/* Checklist Verification Steps */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Cryptographic Audit Checklist
              </div>

              {verificationPoints.map((point, index) => {
                const isPassed = point.status === 'verified';
                return (
                  <div
                    key={point.title}
                    className={cn(
                      'p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs',
                      isPassed
                        ? 'bg-[#181d29] border-white/10 hover:border-cyan-500/30'
                        : 'bg-rose-950/20 border-rose-500/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg mt-0.5',
                          isPassed ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        )}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <FileWarning className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{point.title}</span>
                          {point.date && (
                            <span className="text-[10px] font-mono text-slate-400">
                              (Signed {formatDate(point.date)})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{point.subtitle}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          File: {point.docName}
                        </div>
                      </div>
                    </div>

                    {!isPassed && onSimulateSigning && (
                      <button
                        onClick={() => onSimulateSigning(point.type!)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Sign / Upload</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Complete State Celebration Card */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 border border-cyan-400/40 text-center space-y-1.5 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
              >
                <div className="inline-flex items-center gap-1.5 text-cyan-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>ACTIVE OPERATIONAL STATUS: ISSUED</span>
                </div>
                <p className="text-xs text-slate-300">
                  {person.full_name} is now cleared for active client billing and assignment deployment.
                </p>
              </motion.div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                {isComplete ? 'Close' : 'Cancel'}
              </button>

              {!isComplete && (
                <button
                  type="button"
                  disabled={!canActivate || isVerifying}
                  onClick={handleRunActivationCeremony}
                  className={cn(
                    'relative px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer',
                    canActivate && !isVerifying
                      ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 text-slate-950 font-black shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_30px_rgba(0,240,255,0.55)] hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-[#1e2330] text-slate-500 cursor-not-allowed border border-white/5'
                  )}
                >
                  {isVerifying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Verifying Security Matrix ({verifyStep}/4)...</span>
                    </>
                  ) : canActivate ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>AUTHORIZE & MARK ACTIVE</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>GATE LOCKED (RESOLVE MISSING)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
