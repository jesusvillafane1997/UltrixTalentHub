'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { Opening, SeniorityLevel, OpeningStatus } from '@/types/database';
import { formatCurrency, cn } from '@/lib/utils';
import { CreateOpeningDialog } from '@/components/openings/create-opening-dialog';
import { DeleteOpeningModal } from '@/components/openings/delete-opening-modal';
import {
  Briefcase,
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Loader2,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export default function OpeningsPage() {
  const { currentUser, isAdminOptIn } = useAuth();
  const canManage = Permissions.canManageOpenings(currentUser.role);
  const canSeeComp = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);
  const canDelete = Permissions.canDeleteOpening(currentUser.role);

  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seniorityFilter, setSeniorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openingToDelete, setOpeningToDelete] = useState<{
    id: string;
    title: string;
    candidateCount?: number;
  } | null>(null);

  const fetchOpenings = async () => {
    try {
      setLoading(true);
      const data = await DataService.getOpenings();
      setOpenings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenings();

    const handleTalentSync = () => {
      fetchOpenings();
    };
    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, []);

  // Filtered Openings
  const filteredOpenings = useMemo(() => {
    return openings.filter((op) => {
      // Status filter
      if (statusFilter !== 'all' && op.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Seniority filter
      if (seniorityFilter !== 'all' && op.seniority.toLowerCase() !== seniorityFilter.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (op as any).clients?.name?.toLowerCase() || '';
        const title = op.title.toLowerCase();
        const stackMatches = (op.stack || []).some((tech) => tech.toLowerCase().includes(q));
        if (!title.includes(q) && !clientName.includes(q) && !stackMatches) {
          return false;
        }
      }
      return true;
    });
  }, [openings, statusFilter, seniorityFilter, searchQuery]);

  // Status counts
  const counts = useMemo(() => {
    const total = openings.length;
    const open = openings.filter((o) => o.status === 'Open').length;
    const onHold = openings.filter((o) => o.status === 'On hold').length;
    const filled = openings.filter((o) => o.status === 'Filled').length;
    return { total, open, onHold, filled };
  }, [openings]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.2)]';
      case 'on hold':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'filled':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-white/10 text-slate-300 border-white/15';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-white">
              Openings &amp; Recruitment Pipelines
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {counts.open} ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time client job requisitions, candidate pipeline kanbans, and hiring capacity.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Opening</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 metallic-surface rounded-2xl border border-white/[0.08]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, client, or technology..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#131620] border border-white/[0.1] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#131620] border border-white/[0.08] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                statusFilter === 'open'
                  ? 'bg-cyan-500/20 text-emerald-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Open ({counts.open})
            </button>
            <button
              onClick={() => setStatusFilter('on hold')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                statusFilter === 'on hold'
                  ? 'bg-cyan-500/20 text-amber-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              On Hold ({counts.onHold})
            </button>
            <button
              onClick={() => setStatusFilter('filled')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-semibold transition-all',
                statusFilter === 'filled'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Filled ({counts.filled})
            </button>
          </div>

          {/* Seniority Selector */}
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-[#131620] border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="all">All Seniorities</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Principal">Principal</option>
          </select>

          {/* Grid / Table Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#131620] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-white/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'table' ? 'bg-white/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              )}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Loading job openings from database...</span>
        </div>
      ) : filteredOpenings.length === 0 ? (
        <div className="p-12 metallic-surface rounded-2xl border border-white/[0.12] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Job Openings Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {openings.length === 0
              ? 'No recruitment openings have been created in the database yet. Click below to add your first job opening.'
              : 'No openings match the current search or filter criteria.'}
          </p>
          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Opening Now</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpenings.map((op) => {
            const client = (op as any).clients;
            const owner = (op as any).users;
            const applications = (op as any).applications || [];
            const hiredCount = applications.filter((a: any) => a.pipeline_stages?.name === 'Hired').length;
            const inPipelineCount = applications.length;

            return (
              <Link
                key={op.id}
                href={`/openings/${op.id}`}
                className="group relative p-5 rounded-2xl metallic-surface border border-white/[0.08] hover:border-cyan-400/50 transition-all flex flex-col justify-between space-y-4 shadow-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]"
              >
                {/* Top Row: Title & Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {op.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border',
                          getStatusBadgeStyle(op.status)
                        )}
                      >
                        {op.status}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpeningToDelete({
                              id: op.id,
                              title: op.title,
                              candidateCount: inPipelineCount,
                            });
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Opening"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Client & Seniority */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      {client?.name || 'Direct Client'}
                    </span>
                    <span>&bull;</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                      {op.seniority}
                    </span>
                  </div>
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {(op.stack || []).slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/5"
                    >
                      {tech}
                    </span>
                  ))}
                  {(op.stack || []).length > 4 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.05] text-slate-500">
                      +{(op.stack || []).length - 4}
                    </span>
                  )}
                </div>

                {/* Footer Metrics & Owner */}
                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">
                      Hired:{' '}
                      <strong className={hiredCount >= op.headcount ? 'text-emerald-400' : 'text-cyan-300'}>
                        {hiredCount}/{op.headcount}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-400">{inPipelineCount} in pipeline</span>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Kanban</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Lead Owner Attribution */}
                {owner?.name && (
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span>Owner: {owner.name}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="metallic-surface rounded-2xl border border-white/[0.1] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#10141d] border-b border-white/[0.08] text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Job / Project Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Seniority</th>
                  <th className="py-3 px-4">Tech Stack</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4">Pipeline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredOpenings.map((op) => {
                  const client = (op as any).clients;
                  const owner = (op as any).users;
                  const applications = (op as any).applications || [];
                  const hiredCount = applications.filter((a: any) => a.pipeline_stages?.name === 'Hired').length;
                  const inPipelineCount = applications.length;

                  return (
                    <tr
                      key={op.id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-white">
                        <Link href={`/openings/${op.id}`} className="hover:text-cyan-300 transition-colors">
                          {op.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {client?.name || 'Direct Client'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                          {op.seniority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(op.stack || []).slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                        {hiredCount}/{op.headcount} Hired
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300">
                        {inPipelineCount} active
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border',
                            getStatusBadgeStyle(op.status)
                          )}
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {owner?.name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/openings/${op.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
                          >
                            <span>Pipeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpeningToDelete({
                                  id: op.id,
                                  title: op.title,
                                  candidateCount: inPipelineCount,
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                              title="Delete Opening"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Opening Dialog Modal */}
      <CreateOpeningDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOpeningCreated={() => fetchOpenings()}
      />

      {/* Delete Opening Confirmation Modal */}
      <DeleteOpeningModal
        isOpen={!!openingToDelete}
        onClose={() => setOpeningToDelete(null)}
        opening={openingToDelete}
        onDeleted={() => fetchOpenings()}
      />
    </div>
  );
}
