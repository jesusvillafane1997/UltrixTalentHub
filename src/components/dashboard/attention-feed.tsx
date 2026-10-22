'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Clock, FileWarning, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { DataService } from '@/lib/data-service';
import { createClient } from '@/lib/supabase/client';
import { WorkforceMember } from '@/types/database';
import { cn } from '@/lib/utils';

interface AttentionFeedProps {
  onSelectPerson?: (personId: string) => void;
  members?: WorkforceMember[];
}

export function AttentionFeed({ onSelectPerson, members: externalMembers }: AttentionFeedProps) {
  const [internalMembers, setInternalMembers] = useState<WorkforceMember[]>([]);
  const [stuckApplications, setStuckApplications] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!externalMembers) {
        const m = await DataService.getWorkforceMembers();
        setInternalMembers(m);
      }

      try {
        const supabase = createClient();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: stuck } = await supabase
          .from('applications')
          .select('*, people(id, full_name), openings(id, title), pipeline_stages(id, name, is_terminal)')
          .lt('stage_changed_at', sevenDaysAgo);

        const activeStuck = (stuck || []).filter(
          (a: any) => a.people && !a.pipeline_stages?.is_terminal
        );
        setStuckApplications(activeStuck);
      } catch (err) {
        console.warn('Failed to load stuck applications:', err);
      }
    }
    load();

    const handleTalentSync = () => {
      load();
    };
    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, [externalMembers]);

  const members = externalMembers || internalMembers;

  // 1. Red health flags
  const redFlags = members.filter((m) => m.latest_health === 'Red');
  // 2. Expiring contracts in 30 days
  const expiringContracts = members.filter(
    (m) => m.days_until_expiry != null && m.days_until_expiry <= 30 && m.days_until_expiry >= 0
  );
  // 3. Workers on bench > 14 days
  const longBench = members.filter((m) => m.status === 'bench' && (m.bench_days || 0) >= 14);

  const totalAlerts = redFlags.length + expiringContracts.length + longBench.length + stuckApplications.length;

  if (totalAlerts === 0) {
    return (
      <div className="metallic-surface rounded-2xl p-5 border border-white/[0.11] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Operational Health: 100% Stable</div>
              <div className="text-[11px] text-slate-400">Zero active red flags, no urgent contract expiries within 30 days.</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            Triage Clear
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="metallic-surface rounded-2xl p-5 border border-white/[0.11] shadow-2xl space-y-4 relative overflow-hidden">
      {/* Specular top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-slate-100">
            Operational Attention Feed
          </h3>
          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            {totalAlerts} Items Require Action
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Automated Triage Engine</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Red Health Alert */}
        {redFlags.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.01 }}
            className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-[#1a1f2c] to-[#161a24] border border-rose-500/40 hover:border-rose-400/80 shadow-[0_0_12px_rgba(244,63,94,0.12)] hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 mt-0.5 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{item.full_name}</span>
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                    Red Health Alert
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Latest review health is RED. Immediate client alignment and action plan required.
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectPerson?.(item.id)}
              className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              Triage
            </button>
          </motion.div>
        ))}

        {/* Expiring Contracts */}
        {expiringContracts.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.01 }}
            className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/25 via-[#1a1f2c] to-[#161a24] border border-amber-500/30 hover:border-amber-400/70 shadow-[0_0_10px_rgba(245,158,11,0.1)] transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-0.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                <FileWarning className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{item.full_name}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-200 border border-amber-500/30">
                    Expires in {item.days_until_expiry}d
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Contract extension or SOW renewal must be executed before expiration.
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectPerson?.(item.id)}
              className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              Extend
            </button>
          </motion.div>
        ))}

        {/* Long Bench */}
        {longBench.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.01 }}
            className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/25 via-[#1a1f2c] to-[#161a24] border border-sky-500/30 hover:border-sky-400/70 shadow-[0_0_10px_rgba(56,189,248,0.1)] transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 mt-0.5 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.25)]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{item.full_name}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                    Bench: {item.bench_days}d
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Lead talent idle over 14 days. Priority match with active client openings.
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectPerson?.(item.id)}
              className="px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              Place
            </button>
          </motion.div>
        ))}

        {/* Stuck Candidates in Pipeline (>7 days) */}
        {stuckApplications.map((app) => {
          const daysStuck = Math.max(
            7,
            Math.floor((Date.now() - new Date(app.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24))
          );
          return (
            <motion.div
              key={app.id}
              whileHover={{ scale: 1.01 }}
              className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-[#1a1f2c] to-[#161a24] border border-amber-500/40 hover:border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.12)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-0.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{app.people?.full_name}</span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                      Stuck in Stage: {daysStuck}d
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    In stage &ldquo;{app.pipeline_stages?.name}&rdquo; on opening &ldquo;{app.openings?.title}&rdquo;. Attention required.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectPerson?.(app.person_id)}
                className="px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                Inspect
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
