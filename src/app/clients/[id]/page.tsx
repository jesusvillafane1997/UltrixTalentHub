'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { formatCurrency, cn } from '@/lib/utils';
import { Client, Opening } from '@/types/database';
import {
  Building2,
  Briefcase,
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  Clock,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { CreateOpeningDialog } from '@/components/openings/create-opening-dialog';

function ClientDetailContent() {
  const params = useParams();
  const clientId = params?.id as string;
  const { currentUser, isAdminOptIn } = useAuth();
  const canManage = Permissions.canManageOpenings(currentUser.role);

  const [client, setClient] = useState<any>(null);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadClientData = async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const allClients = await DataService.getClients();
      const matched = allClients.find((c) => c.id === clientId);
      setClient(matched || null);

      const allOpenings = await DataService.getOpenings();
      const clientOps = allOpenings.filter((o) => o.client_id === clientId);
      setOpenings(clientOps);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono">Loading client details...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="metallic-surface rounded-2xl border border-white/[0.12] p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Client Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          The requested client record does not exist or has been removed.
        </p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clients</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/clients" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Clients &amp; Placements</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200 font-semibold">{client.name}</span>
      </div>

      {/* Client Header Panel */}
      <div className="p-6 metallic-surface rounded-2xl border border-white/[0.12] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">{client.name}</h1>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{client.timezone || 'UTC'}</span>
                <span>&bull;</span>
                <span className="text-emerald-300">{client.tier || 'ACTIVE ACCOUNT'}</span>
              </div>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Opening for Client</span>
          </button>
        )}
      </div>

      {/* Openings Created for this Client */}
      <div className="p-6 metallic-surface rounded-2xl border border-white/[0.12] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Client Job Requisitions &amp; Openings</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {openings.length}
            </span>
          </div>
        </div>

        {openings.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
            <p>No job requisitions or recruitment openings have been created for this client yet.</p>
            {canManage && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Opening Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openings.map((op) => (
              <Link
                key={op.id}
                href={`/openings/${op.id}`}
                className="p-4 rounded-xl bg-[#131620] border border-white/5 hover:border-cyan-400/40 transition-all space-y-2.5 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors text-xs line-clamp-1">
                      {op.title}
                    </h4>
                    <span
                      className={cn(
                        'text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border shrink-0',
                        op.status === 'Open'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      )}
                    >
                      {op.status}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Seniority: {op.seniority} &bull; Headcount: {op.headcount}
                  </div>

                  {op.stack && op.stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {op.stack.slice(0, 3).map((s) => (
                        <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-cyan-400">
                  <span>View Pipeline</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateOpeningDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpeningCreated={() => loadClientData()}
      />
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-slate-500">
          Loading client profile...
        </div>
      }
    >
      <ClientDetailContent />
    </Suspense>
  );
}
