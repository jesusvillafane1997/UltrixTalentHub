'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  Search,
  Command,
  Clock,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { UserRole } from '@/types/database';
import { CommandPalette } from './command-palette';
import { cn } from '@/lib/utils';

export function formatRole(role?: string | null): string {
  if (!role) return 'Viewer';
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    hr_manager: 'HR Manager',
    recruiter: 'Recruiter',
    account_manager: 'Account Manager',
    viewer: 'Viewer',
    unassigned: 'Unassigned',
  };
  return roleMap[role.toLowerCase()] || role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatUserName(name?: string | null, email?: string | null): string {
  if (name) {
    const cleaned = name.replace(/\s*\([^)]*\)/g, '').trim();
    if (cleaned) return cleaned;
  }
  if (email) {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return 'User';
}

export function getRoleBadgeStyle(role?: string | null): string {
  const cleanRole = (role || 'viewer').toLowerCase();
  switch (cleanRole) {
    case 'admin':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]';
    case 'hr_manager':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]';
    case 'recruiter':
      return 'bg-teal-500/15 text-teal-300 border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]';
    case 'account_manager':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
    case 'viewer':
      return 'bg-slate-700/30 text-slate-300 border-slate-600/40';
    case 'unassigned':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
    default:
      return 'bg-white/10 text-slate-300 border-white/20';
  }
}

export function Header() {
  const { user, currentUser, isLoading, logout, isAdminOptIn, setIsAdminOptIn } = useAuth();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('17:35 ART');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        `${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} ART`
      );
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeUser = user || (currentUser?.email ? currentUser : null);
  const displayName = activeUser ? formatUserName(activeUser.name, activeUser.email) : '';
  const formattedRole = activeUser ? formatRole(activeUser.role) : '';

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/[0.1] bg-[#141822]/90 px-6 backdrop-blur-xl shadow-md shadow-black/25 relative">
        {/* Top titanium specular highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />

        {/* Brand & Telemetry */}
        <div className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className="flex items-center font-bold tracking-tight text-slate-100 text-sm hover:text-white transition-colors"
          >
            ULTRIX TALENT HUB
          </Link>

          {/* Live System Status Pill */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400 border-l border-white/[0.1] pl-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              <span className="text-slate-300">Supabase Connected</span>
            </div>
            <span className="text-slate-600">&bull;</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Global Search and User Session Controls */}
        <div className="flex items-center gap-3">
          {/* Omni Search Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden sm:flex items-center justify-between gap-3 h-9 w-60 lg:w-68 px-3 rounded-xl bg-[#1a1f2b]/90 hover:bg-[#222938] border border-white/[0.1] hover:border-cyan-400/40 text-xs text-slate-300 hover:text-slate-100 transition-all shadow-inner group hover:shadow-[0_0_14px_rgba(0,240,255,0.15)]"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-slate-400 text-xs group-hover:text-slate-300">Search talent, jobs...</span>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#131620] border border-white/10 text-slate-400 group-hover:text-slate-200">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </button>

          {/* Dynamic User Profile Badge */}
          <div className="flex items-center gap-2 pl-2">
            {isLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#181d29]/95 border border-white/[0.12]">
                <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                <span className="text-slate-600">·</span>
                <div className="w-12 h-4 bg-white/10 rounded animate-pulse" />
              </div>
            ) : activeUser ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#181d29]/95 border border-white/[0.12] shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                  <span className="tracking-tight">{displayName}</span>
                  <span className="text-slate-500 font-normal">·</span>
                  <span
                    className={cn(
                      'text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border',
                      getRoleBadgeStyle(activeUser.role)
                    )}
                  >
                    {formattedRole}
                  </span>
                </div>

                {/* Optional Admin Opt-In for Viewer testing */}
                {activeUser.role === 'viewer' && (
                  <label className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-300 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-white/10 ml-1">
                    <input
                      type="checkbox"
                      checked={isAdminOptIn}
                      onChange={(e) => setIsAdminOptIn(e.target.checked)}
                      className="rounded border-white/20 text-cyan-400 focus:ring-0"
                    />
                    <span>Comp Opt-In</span>
                  </label>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all shadow-sm"
              >
                Log in
              </Link>
            )}

            {/* Logout Button */}
            {activeUser && (
              <button
                onClick={() => logout()}
                title="Log Out of Ultrix Talent Hub"
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-400/50 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Log out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
