'use client';

import React, { useState, useEffect } from 'react';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { AttentionFeed } from '@/components/dashboard/attention-feed';
import { WorkforceTable } from '@/components/dashboard/workforce-table';
import { PersonDrawer } from '@/components/people/person-drawer';
import { ActiveGateCeremony } from '@/components/people/active-gate-ceremony';
import { useAuth } from '@/context/auth-context';
import { DataService } from '@/lib/data-service';
import { Person, Contract, WorkforceMember } from '@/types/database';
import { Sparkles, ShieldCheck, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [activeGatePerson, setActiveGatePerson] = useState<Person | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [workforceMembers, setWorkforceMembers] = useState<WorkforceMember[]>([]);

  const loadData = async () => {
    const data = await DataService.getWorkforceMembers();
    setWorkforceMembers(data);
  };

  useEffect(() => {
    loadData();

    const handleTalentSync = () => {
      loadData();
    };
    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, []);

  const handleOpenActiveGate = (person: Person) => {
    setActiveGatePerson(person);
  };

  const handleActivationSuccess = () => {
    loadData();
    setActiveGatePerson(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Telemetry Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.1]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-100">
              Talent Operations Center
            </h1>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              LIVE DATABASE MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time workforce intelligence, placement health indicators, and legal gate compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-300 bg-[#181d29]/90 border border-white/[0.12] px-3.5 py-1.5 rounded-xl font-mono shadow-sm">
            Active Identity:{' '}
            <strong className="text-slate-100 font-semibold">{currentUser.name}</strong> (
            <span className="text-cyan-400 uppercase font-bold">{currentUser.role}</span>)
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards members={workforceMembers} />

      {/* Operational Attention Feed */}
      <AttentionFeed
        members={workforceMembers}
        onSelectPerson={(id) => setSelectedPersonId(id)}
      />

      {/* Master Workforce Table */}
      <WorkforceTable
        members={workforceMembers}
        onRefresh={loadData}
        onSelectPerson={(id) => setSelectedPersonId(id)}
      />

      {/* Spatial Person Drawer Flyout */}
      <PersonDrawer
        personId={selectedPersonId}
        onClose={() => setSelectedPersonId(null)}
        onOpenActiveGateCeremony={handleOpenActiveGate}
      />

      {/* Signature Active Gate Verification Ceremony */}
      {activeGatePerson && (
        <ActiveGateCeremony
          person={activeGatePerson}
          contracts={contracts.filter((k) => k.person_id === activeGatePerson.id)}
          isOpen={true}
          onClose={() => setActiveGatePerson(null)}
          onActivateSuccess={handleActivationSuccess}
        />
      )}
    </div>
  );
}
