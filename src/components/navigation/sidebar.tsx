'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  ClipboardCheck,
  History,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on the landing / login authentication pages
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  const { currentUser } = useAuth();
  const [peopleCount, setPeopleCount] = useState<number>(0);
  const [openingsCount, setOpeningsCount] = useState<number>(0);
  const [clientsCount, setClientsCount] = useState<number>(0);

  const syncCounts = () => {
    DataService.getPeople().then((p) => setPeopleCount(p.length)).catch(() => {});
    DataService.getOpenings().then((o) => setOpeningsCount(o.length)).catch(() => {});
    DataService.getClients().then((c) => setClientsCount(c.length)).catch(() => {});
  };

  useEffect(() => {
    syncCounts();
    window.addEventListener('ultrix-talent-updated', syncCounts);
    window.addEventListener('focus', syncCounts);
    return () => {
      window.removeEventListener('ultrix-talent-updated', syncCounts);
      window.removeEventListener('focus', syncCounts);
    };
  }, []);

  const navItems = [
    {
      label: 'HR Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]',
      allowed: true,
    },
    {
      label: 'People Directory',
      href: '/people',
      icon: Users,
      badge: `${peopleCount}`,
      badgeColor: 'text-slate-300 bg-white/[0.06] border-white/10',
      allowed: true,
    },
    {
      label: 'Candidates Pool',
      href: '/recruiting/candidates',
      icon: UserCheck,
      badge: 'Pool',
      badgeColor: 'text-teal-300 bg-teal-500/15 border-teal-500/30 shadow-[0_0_8px_rgba(20,184,166,0.18)]',
      allowed: true,
    },
    {
      label: 'Openings',
      href: '/openings',
      icon: Briefcase,
      badge: `${openingsCount} Open`,
      badgeColor: 'text-sky-300 bg-sky-500/15 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.2)]',
      allowed: true,
    },
    {
      label: 'Clients & Placements',
      href: '/clients',
      icon: Building2,
      badge: `${clientsCount} Active`,
      badgeColor: 'text-slate-300 bg-white/[0.06] border-white/10',
      allowed: true,
    },
    {
      label: 'Monthly Reviews',
      href: '/reviews',
      icon: ClipboardCheck,
      badge: '1 Red',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] animate-pulse',
      allowed: true,
    },
    {
      label: 'Audit & Activity',
      href: '/activity',
      icon: History,
      allowed: true,
    },
    {
      label: 'Admin Console',
      href: '/settings',
      icon: Settings,
      allowed: Permissions.canManageSettings(currentUser.role),
      adminOnly: true,
    },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.1] bg-[#141822]/95 flex flex-col justify-between p-4 shrink-0 backdrop-blur-xl shadow-lg shadow-black/25">
      <div className="space-y-6">
        <div className="px-2 py-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">
            <span>Navigation Hub</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
          </div>

          <nav className="mt-1 space-y-1">
            {navItems.map((item) => {
              if (!item.allowed) return null;
              const Icon = item.icon;
              const isCandidateSubroute = pathname?.startsWith('/recruiting/candidates');
              const isActive =
                item.href === '/openings'
                  ? pathname?.startsWith('/openings') || (pathname?.startsWith('/recruiting') && !isCandidateSubroute)
                  : pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'text-slate-100 bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-transparent border border-cyan-500/40 shadow-[0_0_14px_rgba(0,240,255,0.15)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-cyan-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                        item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.adminOnly && (
                    <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Unassigned Role Notice */}
        {currentUser.role === 'unassigned' && (
          <div className="mx-2 p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Role Pending</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              New accounts require Admin approval before accessing people data.
            </p>
          </div>
        )}
      </div>

      {/* Active Gate Protocol Footer Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1d2331] to-[#151922] border border-white/[0.12] space-y-2 shadow-md shadow-black/30 relative overflow-hidden">
        {/* Specular top sheen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Active Gate Rule</span>
          </div>
          <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_6px_rgba(0,240,255,0.2)]">
            Enforced
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Zero unverified workers on client payroll. Signed MSA & NDA mandatory before activation.
        </p>
      </div>
    </aside>
  );
}
