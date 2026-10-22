'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, AlertTriangle, FileWarning, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { DataService } from '@/lib/data-service';
import { createClient } from '@/lib/supabase/client';
import { WorkforceMember, Opening } from '@/types/database';
import { cn } from '@/lib/utils';

interface KpiCardsProps {
  members?: WorkforceMember[];
  openings?: Opening[];
}

export function KpiCards({ members: externalMembers, openings: externalOpenings }: KpiCardsProps) {
  const [internalMembers, setInternalMembers] = useState<WorkforceMember[]>([]);
  const [internalOpenings, setInternalOpenings] = useState<Opening[]>([]);
  const [pipelineCount, setPipelineCount] = useState<number>(0);

  useEffect(() => {
    async function load() {
      if (!externalMembers) {
        const m = await DataService.getWorkforceMembers();
        setInternalMembers(m);
      }
      if (!externalOpenings) {
        const o = await DataService.getOpenings();
        setInternalOpenings(o);
      }
      try {
        const supabase = createClient();
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true });
        if (count !== null) setPipelineCount(count);
      } catch {}
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
  }, [externalMembers, externalOpenings]);

  const members = externalMembers || internalMembers;
  const openings = externalOpenings || internalOpenings;

  const activeCount = members.filter((m) => m.status === 'active').length;
  const benchCount = members.filter((m) => m.status === 'bench').length;
  const candidateCount = members.filter((m) => m.status === 'candidate').length;
  const openOpenings = openings.filter((o) => o.status === 'Open').length;
  const redFlags = members.filter((m) => m.latest_health === 'Red').length;
  const expiringContracts = members.filter(
    (m) => m.days_until_expiry != null && m.days_until_expiry <= 30 && m.days_until_expiry >= 0
  ).length;

  const kpis = [
    {
      label: 'Active Placements',
      value: activeCount,
      total: activeCount > 0 ? `Across active clients` : 'No placements yet',
      icon: Users,
      trend: activeCount > 0 ? '100% Retained' : 'Ready to staff',
      accent: 'text-cyan-300',
      bgGlow: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]',
      iconBg: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]',
    },
    {
      label: 'Bench Readiness',
      value: benchCount,
      total: benchCount > 0 ? `${benchCount} talent available` : '0 talent on bench',
      icon: Clock,
      trend: benchCount > 0 ? 'Bench active' : 'Full utilization',
      accent: 'text-sky-300',
      bgGlow: 'hover:border-sky-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]',
      iconBg: 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]',
    },
    {
      label: 'Open Positions',
      value: openOpenings,
      total: `${pipelineCount || candidateCount} candidate${(pipelineCount || candidateCount) === 1 ? '' : 's'} in pipeline`,
      icon: Briefcase,
      trend: `${pipelineCount || candidateCount} in pipeline`,
      accent: 'text-teal-300',
      bgGlow: 'hover:border-teal-400/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]',
      iconBg: 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)]',
    },
    {
      label: 'Health & Risk Alerts',
      value: redFlags,
      total: expiringContracts > 0 ? `${expiringContracts} contracts ending soon` : '0 expiring contracts',
      icon: AlertTriangle,
      trend: redFlags > 0 ? `${redFlags} Red Flags` : 'Zero Red Flags',
      accent: redFlags > 0 ? 'text-rose-400' : 'text-emerald-400',
      bgGlow: redFlags > 0
        ? 'hover:border-rose-400/60 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]'
        : 'hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
      iconBg: redFlags > 0
        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'
        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -3 }}
            className={cn(
              'metallic-surface rounded-2xl p-5 border border-white/[0.11] shadow-xl transition-all relative overflow-hidden group',
              kpi.bgGlow
            )}
          >
            {/* Top titanium specular light accent */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                {kpi.label}
              </span>
              <div className={cn('p-2.5 rounded-xl transition-transform group-hover:scale-110', kpi.iconBg)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl font-black tracking-tight text-slate-100 font-mono">
                {kpi.value}
              </div>
              <span className={cn('text-xs font-semibold font-mono', kpi.accent)}>
                {kpi.trend}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">{kpi.total}</span>
              <Sparkles className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
