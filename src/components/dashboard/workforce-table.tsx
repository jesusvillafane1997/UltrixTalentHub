'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { WorkforceMember, PersonStatus, Person } from '@/types/database';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Upload,
  Lock,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';
import { CsvImportModal } from '@/components/people/csv-import-modal';
import { AddCandidateModal } from '@/components/recruiting/add-candidate-modal';

interface WorkforceTableProps {
  onSelectPerson?: (personId: string) => void;
  members?: WorkforceMember[];
  onRefresh?: () => void;
}

export function WorkforceTable({ onSelectPerson, members: externalMembers, onRefresh }: WorkforceTableProps) {
  const { currentUser, isAdminOptIn } = useAuth();
  const [importedMembers, setImportedMembers] = useState<WorkforceMember[]>([]);
  const [internalMembers, setInternalMembers] = useState<WorkforceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    if (externalMembers) return;
    setIsLoading(true);
    try {
      const data = await DataService.getWorkforceMembers();
      setInternalMembers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTalentSync = () => {
      loadData();
      onRefresh?.();
    };

    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, []);

  const baseMembers = externalMembers || internalMembers;

  const allMembers = useMemo(
    () => [...importedMembers, ...baseMembers],
    [importedMembers, baseMembers]
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof WorkforceMember>('full_name');
  const [sortAsc, setSortAsc] = useState(true);

  // RBAC checks
  const canSeeSalary = Permissions.canViewCompensation(currentUser.role, isAdminOptIn);
  const canSeeMargin = Permissions.canViewMargin(currentUser.role, isAdminOptIn);
  const canAdd = Permissions.canAddCandidate(currentUser.role);

  // Filter and Sort
  const filteredMembers = useMemo(() => {
    return allMembers
      .filter((m) => {
        const matchesSearch =
          m.full_name.toLowerCase().includes(search.toLowerCase()) ||
          (m.skills && m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))) ||
          (m.client_name && m.client_name.toLowerCase().includes(search.toLowerCase())) ||
          m.email.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [allMembers, search, statusFilter, sortField, sortAsc]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Status',
      'Seniority',
      'Client',
      'Role Title',
      'Start Date',
      'Latest Health',
      'Contract Expiry',
      'Account Manager',
    ];

    if (canSeeSalary) headers.push('Current Salary');
    if (canSeeMargin) headers.push('Monthly Margin');

    const rows = filteredMembers.map((m) => {
      const row = [
        `"${m.full_name}"`,
        `"${m.status}"`,
        `"${m.seniority}"`,
        `"${m.client_name || 'Bench'}"`,
        `"${m.role_title || '—'}"`,
        `"${m.assignment_start_date || '—'}"`,
        `"${m.latest_health || '—'}"`,
        `"${m.next_expiry_date || '—'}"`,
        `"${m.account_manager_name || '—'}"`,
      ];
      if (canSeeSalary) row.push(`"${m.current_salary || ''}"`);
      if (canSeeMargin) row.push(`"${m.monthly_margin || ''}"`);
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ultrix_workforce_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportComplete = (imported: any[]) => {
    const formatted: WorkforceMember[] = imported.map((p, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      full_name: p.full_name || 'Imported Talent',
      email: p.email || 'talent@imported.io',
      country: p.country || 'LATAM',
      timezone: p.timezone || 'America/Buenos_Aires',
      status: (p.status?.toLowerCase() as PersonStatus) || 'active',
      seniority: p.seniority || 'Mid',
      skills: Array.isArray(p.skills) ? p.skills : ['Developer'],
      english_level: p.english_level || 'B2',
      photo_url: null,
      availability_date: null,
      created_at: new Date().toISOString(),
      assignment_id: null,
      client_id: null,
      client_name: p.client_name || null,
      role_title: p.role_title || null,
      assignment_start_date: null,
      account_manager_id: null,
      account_manager_name: null,
      bill_rate: p.bill_rate ? parseFloat(p.bill_rate) : null,
      bill_rate_unit: 'monthly',
      current_salary: p.current_salary ? parseFloat(p.current_salary) : null,
      salary_currency: 'USD',
      salary_frequency: 'monthly',
      monthly_margin:
        p.bill_rate && p.current_salary
          ? parseFloat(p.bill_rate) - parseFloat(p.current_salary)
          : null,
      bench_days: p.status === 'bench' ? 14 : 0,
      latest_health: null,
      latest_score: null,
      latest_review_period: null,
      next_expiry_date: null,
      days_until_expiry: null,
    }));
    setImportedMembers((prev) => [...formatted, ...prev]);
  };

  const handleCandidateCreated = (newPerson: Person) => {
    loadData();
    onRefresh?.();
  };

  const toggleSort = (field: keyof WorkforceMember) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const statusStyles: Record<
    PersonStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    active: {
      label: 'Active Placement',
      bg: 'bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.15)]',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
    },
    bench: {
      label: 'Bench Readiness',
      bg: 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    onboarding: {
      label: 'Onboarding (Gate)',
      bg: 'bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.15)]',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
    },
    candidate: {
      label: 'Candidate (ATS)',
      bg: 'bg-teal-500/15 border-teal-500/30 shadow-[0_0_8px_rgba(20,184,166,0.15)]',
      text: 'text-teal-300',
      dot: 'bg-teal-400',
    },
    offboarded: {
      label: 'Offboarded',
      bg: 'bg-slate-700/30 border-slate-600/30',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
    },
    rejected: {
      label: 'Talent Pool',
      bg: 'bg-slate-800/40 border-slate-700/40',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
    },
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search talent, skills, client..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-white/[0.12] bg-[#181d28]/90 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-xs font-medium rounded-xl border border-white/[0.12] bg-[#181d28]/90 px-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="all">All Statuses ({allMembers.length})</option>
            <option value="active">Active Placements</option>
            <option value="bench">Bench Readiness</option>
            <option value="onboarding">Onboarding</option>
            <option value="candidate">Recruiting Candidates</option>
            <option value="rejected">Talent Pool (Past)</option>
          </select>

          {/* Add Candidate (Admin, HR Manager, Recruiter) */}
          {canAdd && (
            <button
              onClick={() => setIsAddCandidateOpen(true)}
              className="h-8 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Candidate</span>
            </button>
          )}

          {/* Import from CSV (Admin & HR Manager) */}
          {['admin', 'hr_manager'].includes(currentUser.role) && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-8 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          )}

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-semibold rounded-xl border border-white/[0.12] bg-[#1d2331] hover:bg-[#252c3e] text-slate-200 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Status Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {[
          { id: 'all', label: 'All People', count: allMembers.length },
          { id: 'active', label: 'Active Placements', count: allMembers.filter((m) => m.status === 'active').length },
          { id: 'bench', label: 'Bench Readiness', count: allMembers.filter((m) => m.status === 'bench').length },
          { id: 'candidate', label: 'Candidates', count: allMembers.filter((m) => m.status === 'candidate').length },
          { id: 'onboarding', label: 'Onboarding', count: allMembers.filter((m) => m.status === 'onboarding').length },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 bg-[#161a25] border border-white/[0.06] hover:bg-white/[0.04]'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded-full',
                  isSelected ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/5 text-slate-500'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Master Titanium Table Frame */}
      <div className="border border-white/[0.1] rounded-xl overflow-hidden bg-[#131620]/90 shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#181d28] border-b border-white/[0.1] text-slate-400 uppercase text-[10px] font-mono tracking-wider font-semibold">
              <tr>
                <th
                  className="px-4 py-3 cursor-pointer hover:text-slate-100 transition-colors"
                  onClick={() => toggleSort('full_name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Talent Profile</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Client Assignment</th>
                <th className="px-4 py-3">Role &amp; Seniority</th>
                <th className="px-4 py-3">Placement Health</th>
                <th className="px-4 py-3">Contract Expiry</th>
                <th className="px-4 py-3">Current Salary</th>
                <th className="px-4 py-3">Gross Margin</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                        <Users className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-200">
                          {search || statusFilter !== 'all'
                            ? 'No matching people found'
                            : 'No active workers or candidates found'}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {search || statusFilter !== 'all'
                            ? 'Try clearing your search query or switching to "All People".'
                            : 'Your live database is connected. Add your first candidate directly using the button below.'}
                        </p>
                      </div>
                      {canAdd && (
                        <button
                          onClick={() => setIsAddCandidateOpen(true)}
                          className="mt-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Add First Candidate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const statusMeta = statusStyles[member.status] || statusStyles.candidate;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => onSelectPerson?.(member.id)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Name & Location */}
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {member.full_name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {member.country} &bull; {member.english_level}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 w-fit',
                            statusMeta.bg,
                            statusMeta.text
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusMeta.dot)} />
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3">
                        {member.client_name ? (
                          <div className="font-semibold text-slate-200">{member.client_name}</div>
                        ) : member.status === 'bench' ? (
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Available ({member.bench_days}d)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Role & Seniority */}
                      <td className="px-4 py-3">
                        <div className="text-slate-200 font-medium">
                          {member.role_title || member.seniority}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {member.skills?.slice(0, 3).join(', ') || 'Generalist'}
                        </div>
                      </td>

                      {/* Health */}
                      <td className="px-4 py-3">
                        {member.latest_health ? (
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-2 py-0.5 rounded border',
                              member.latest_health === 'Green' &&
                                'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                              member.latest_health === 'Yellow' &&
                                'bg-amber-500/15 text-amber-300 border-amber-500/30',
                              member.latest_health === 'Red' &&
                                'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            )}
                          >
                            {member.latest_health} ({member.latest_score?.toFixed(1) || '—'})
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Contract Expiry */}
                      <td className="px-4 py-3">
                        {member.next_expiry_date ? (
                          <div className="font-mono text-[11px] text-slate-300">
                            {formatDate(member.next_expiry_date)}
                            {member.days_until_expiry != null && (
                              <span
                                className={cn(
                                  'ml-1 text-[10px]',
                                  member.days_until_expiry <= 30
                                    ? 'text-rose-400 font-bold'
                                    : 'text-slate-500'
                                )}
                              >
                                ({member.days_until_expiry}d)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Salary */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {canSeeSalary ? (
                          member.current_salary ? (
                            formatCurrency(member.current_salary, member.salary_currency || 'USD')
                          ) : (
                            <span className="text-slate-500">—</span>
                          )
                        ) : (
                          <span className="text-slate-500 text-[11px] italic flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Protected</span>
                          </span>
                        )}
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {canSeeMargin ? (
                          member.monthly_margin != null ? (
                            <span
                              className={cn(
                                'font-bold',
                                member.monthly_margin >= 3000
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              )}
                            >
                              +{formatCurrency(member.monthly_margin, 'USD')}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">—</span>
                          )
                        ) : (
                          <span className="text-slate-500 text-[11px] italic flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Protected</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPerson?.(member.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onCandidateCreated={handleCandidateCreated}
      />
    </div>
  );
}
