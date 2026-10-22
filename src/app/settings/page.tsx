'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { DataService } from '@/lib/data-service';
import { createClient } from '@/lib/supabase/client';
import { UserRole, User, PipelineStage } from '@/types/database';
import { Settings, Shield, Lock, UserCheck, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const isAdmin = Permissions.canManageSettings(currentUser.role);

  const [users, setUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([DataService.getUsers(), DataService.getPipelineStages()]).then(
      ([userList, stageList]) => {
        if (isMounted) {
          setUsers(userList);
          setStages(stageList);
          setLoading(false);
        }
      }
    );
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        toast.error(`Failed to update role: ${error.message}`);
      } else {
        toast.success(`Role updated to ${newRole}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating user role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center glass-panel rounded-2xl border border-dashed border-rose-500/30 space-y-4 max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Admin Privilege Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Settings, role assignment, and pipeline configuration are restricted to Admin users only (David / Ops Lead).
          Switch to <strong className="text-white">David (ADMIN)</strong> in the top header role selector to manage permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              System Settings & Role Management
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              ADMIN CONSOLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure internal staff permissions, RBAC access levels, and recruiting pipeline stages.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono">Loading staff configurations...</span>
        </div>
      ) : (
        <>
          {/* Staff User Role Assignment */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] shadow-2xl space-y-5">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Ultrix Staff & Roles</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff members authenticated via internal login. Changes take effect on next session refresh.
              </p>
            </div>

            <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-[#141822]">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{user.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{user.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">Assigned Role:</span>
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                      className="h-8 text-xs font-semibold rounded-lg border border-white/10 bg-[#181d28] px-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                    >
                      <option value="admin">Admin (Ops Lead)</option>
                      <option value="hr_manager">HR Manager (Full Data)</option>
                      <option value="recruiter">Recruiter (ATS & Openings)</option>
                      <option value="account_manager">Account Manager (Own Clients)</option>
                      <option value="viewer">Viewer (Read-Only)</option>
                      <option value="unassigned">Unassigned (Pending)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Stages */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] shadow-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recruiting Pipeline Stages</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Default stages used for Kanban candidate tracking.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="p-3.5 rounded-xl bg-[#141822] border border-white/5 text-center text-xs space-y-1"
                >
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">Step {stage.stage_order}</div>
                  <div className="font-bold text-white text-xs">{stage.name}</div>
                  {stage.is_terminal && (
                    <span className="text-[9px] font-mono uppercase font-bold text-emerald-400 block pt-0.5">
                      Terminal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
