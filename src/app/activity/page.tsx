'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/data-service';
import { formatDate } from '@/lib/utils';
import { ActivityLog } from '@/types/database';
import { History, Shield, Clock, User, FileText, CheckCircle2, Loader2, Inbox } from 'lucide-react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    DataService.getActivityLog().then((res: any[]) => {
      if (isMounted) {
        setLogs(res);
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
              Immutable Activity & Audit Trail
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              AUDIT COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic ledger tracking talent status transitions, contract views, and compensation mutations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Loading immutable audit trail...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 metallic-surface rounded-2xl border border-white/[0.12] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Activity Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            System actions such as candidate creation, CV uploads, stage moves, and contract updates will be automatically recorded here.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#141822] border-b border-white/10 text-slate-400 uppercase text-[10px] font-mono tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Target Talent</th>
                <th className="px-5 py-3.5">Audit Log Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => {
                const actorName = log.users?.name || 'System Auto-Trigger';
                const personName = log.people?.full_name || '—';

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">
                      <span>{actorName}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 capitalize font-mono text-slate-400 text-[11px]">
                      {log.entity_type}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {personName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 max-w-md truncate text-[11px] font-mono">
                      {log.note || (log.diff ? JSON.stringify(log.diff) : 'Action recorded')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
