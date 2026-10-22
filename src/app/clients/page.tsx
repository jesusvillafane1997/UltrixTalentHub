'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { formatCurrency } from '@/lib/utils';
import { Client } from '@/types/database';
import {
  Building2,
  User,
  Lock,
  Mail,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Loader2,
  Inbox,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClientsPage() {
  const { currentUser, isAdminOptIn } = useAuth();
  const canSeeMargin = Permissions.canViewMargin(currentUser.role, isAdminOptIn);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    DataService.getClients().then((res) => {
      if (isMounted) {
        setClients(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Clients & Placements
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              STAFF AUG CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active client accounts, placed talent rosters, bill rate governance, and gross margins.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Loading clients from database...</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 metallic-surface rounded-2xl border border-white/[0.12] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Clients Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            There are currently no active clients recorded in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: any) => {
            const amName = client.users?.name || 'Account Lead';
            const isOwnClient = client.account_manager_id === currentUser.id;
            const canSeeBillRate = Permissions.canViewBillRate(
              currentUser.role,
              isOwnClient,
              isAdminOptIn
            );

            const assignments = client.assignments || [];
            const activeAssignments = assignments.filter((a: any) => a.status === 'Active');
            const totalMonthlyBilling = activeAssignments.reduce(
              (acc: number, a: any) => acc + (a.bill_rate || 0),
              0
            );

            return (
              <motion.div
                key={client.id}
                whileHover={{ y: -3 }}
                className="p-6 rounded-2xl glass-panel border border-white/[0.08] shadow-xl space-y-5 hover:border-cyan-400/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {client.tier || 'ACTIVE CLIENT'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{client.timezone || 'UTC'}</span>
                  </div>

                  <div>
                    <Link href={`/clients/${client.id}`} className="hover:text-cyan-300 transition-colors group">
                      <h3 className="font-extrabold text-lg text-white group-hover:text-cyan-300 flex items-center gap-2 tracking-tight">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span>{client.name}</span>
                      </h3>
                    </Link>
                    {(client.contact_name || client.contact_email) && (
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {client.contact_name} {client.contact_email ? `(${client.contact_email})` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#141822] border border-white/5 text-xs space-y-1">
                    <div className="text-slate-500 text-[10px] font-mono uppercase font-bold">
                      Assigned Account Lead
                    </div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{amName}</span>
                    </div>
                  </div>

                  {/* Assigned Workers */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase font-bold">
                      <span>Active Placements ({activeAssignments.length})</span>
                      {canSeeBillRate && (
                        <span className="text-white font-mono">{formatCurrency(totalMonthlyBilling)}/mo</span>
                      )}
                    </div>

                    {activeAssignments.length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#141822] border border-white/5 text-center text-xs text-slate-500 font-mono">
                        No active talent placed yet
                      </div>
                    ) : (
                      activeAssignments.map((asg: any) => {
                        const workerName = asg.people?.full_name || 'Talent Member';
                        const salary = asg.people?.salary_expectation || 0;
                        const margin = salary ? asg.bill_rate - salary : null;

                        return (
                          <div
                            key={asg.id}
                            className="p-3 rounded-xl bg-[#141822] border border-white/5 flex items-center justify-between text-xs hover:bg-white/[0.03] transition-colors"
                          >
                            <div>
                              <Link
                                href={`/people/${asg.person_id}`}
                                className="font-bold text-white hover:text-cyan-300 transition-colors"
                              >
                                {workerName}
                              </Link>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {asg.role_title}
                              </div>
                            </div>

                            <div className="text-right">
                              {canSeeBillRate ? (
                                <div className="font-bold font-mono text-white text-xs">
                                  {formatCurrency(asg.bill_rate)}/mo
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-500 text-[10px] italic">
                                  <Lock className="w-3 h-3" />
                                  <span>Restricted</span>
                                </div>
                              )}

                              {canSeeMargin && margin != null && (
                                <div className="text-[10px] font-mono font-bold text-teal-400">
                                  +{formatCurrency(margin)}/mo margin
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Client Job Openings */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase font-bold">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-cyan-400" />
                        <span>Job Openings ({client.openings?.length || 0})</span>
                      </span>
                    </div>

                    {!client.openings || client.openings.length === 0 ? (
                      <div className="p-2.5 rounded-xl bg-[#141822] border border-white/5 text-center text-[11px] text-slate-500 font-mono">
                        No active openings for this client
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {client.openings.map((op: any) => (
                          <Link
                            key={op.id}
                            href={`/openings/${op.id}`}
                            className="p-2.5 rounded-xl bg-[#141822] border border-white/5 hover:border-cyan-400/40 flex items-center justify-between text-xs transition-colors group"
                          >
                            <span className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate max-w-[170px]">
                              {op.title}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border',
                                op.status === 'Open'
                                  ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                                  : 'text-slate-400 bg-white/5 border-white/10'
                              )}
                            >
                              {op.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
