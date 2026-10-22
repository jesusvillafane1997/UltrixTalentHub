'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DataService } from '@/lib/data-service';
import { Person, Client, Opening } from '@/types/database';
import { useAuth } from '@/context/auth-context';
import {
  Search,
  User,
  Building2,
  Briefcase,
  ArrowRight,
  X,
  Command,
  ShieldCheck,
  Download,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { setRole } = useAuth();
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);

  useEffect(() => {
    if (isOpen) {
      DataService.getPeople().then(setPeople).catch(() => {});
      DataService.getClients().then(setClients).catch(() => {});
      DataService.getOpenings().then(setOpenings).catch(() => {});
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredPeople = people.filter((p) =>
    query
      ? p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        (p.skills || []).some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
        (p.country || '').toLowerCase().includes(query.toLowerCase())
      : true
  ).slice(0, 4);

  const filteredClients = clients.filter((c) =>
    query ? c.name.toLowerCase().includes(query.toLowerCase()) : true
  ).slice(0, 3);

  const filteredOpenings = openings.filter((o) =>
    query ? o.title.toLowerCase().includes(query.toLowerCase()) : true
  ).slice(0, 3);

  const quickActions = [
    {
      title: 'Triage October Red Review (Camila Alvarez)',
      icon: AlertTriangle,
      color: 'text-rose-400',
      action: () => {
        onClose();
        router.push('/reviews');
      },
    },
    {
      title: 'Inspect Valentina Gomez (Active Gate Verification)',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      action: () => {
        onClose();
        router.push('/people?id=a1000001-0000-0000-0000-000000000004');
      },
    },
    {
      title: 'Switch Role to David (Admin / Ops Lead)',
      icon: Command,
      color: 'text-amber-400',
      action: () => {
        setRole('admin');
        onClose();
      },
    },
  ];

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-md p-4">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl bg-[#141824]/98 rounded-2xl border border-white/[0.14] shadow-2xl overflow-hidden z-10 backdrop-blur-2xl"
        >
          {/* Top specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />

          {/* Search Input Bar */}
          <div className="flex items-center px-4 border-b border-white/10 bg-[#181d29]/90">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
            <input
              autoFocus
              type="text"
              placeholder="Search talent, clients, jobs, or run quick actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-13 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2.5 space-y-3 text-xs">
            {/* Quick Actions (when query is short or empty) */}
            {query === '' && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Quick Actions
                </div>
                <div className="space-y-0.5 mt-1">
                  {quickActions.map((qa) => {
                    const Icon = qa.icon;
                    return (
                      <button
                        key={qa.title}
                        onClick={qa.action}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${qa.color}`} />
                          <span className="font-semibold text-slate-200 group-hover:text-white">
                            {qa.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* People Results */}
            {filteredPeople.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  People (Workers & Candidates)
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handleSelect(`/people/${person.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {person.full_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {person.seniority} • {person.country} • {person.skills.slice(0, 2).join(', ')}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        {person.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clients Results */}
            {filteredClients.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Client Accounts
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelect('/clients')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="font-bold text-slate-100">{client.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{client.timezone}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Openings Results */}
            {filteredOpenings.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                  Recruiting Openings
                </div>
                <div className="space-y-0.5 mt-1">
                  {filteredOpenings.map((opening) => (
                    <button
                      key={opening.id}
                      onClick={() => handleSelect(`/recruiting/openings/${opening.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Briefcase className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="font-bold text-slate-100">{opening.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">{opening.seniority}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        {opening.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 bg-[#181d29] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded bg-[#131620] border border-white/10 text-[10px] text-slate-300">ESC</kbd> to exit
            </span>
            <span>Ultrix Omni Command HUD</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
