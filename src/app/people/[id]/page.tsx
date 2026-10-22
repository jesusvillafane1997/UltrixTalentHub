'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DataService } from '@/lib/data-service';
import { Person } from '@/types/database';
import { PersonProfile } from '@/components/people/person-profile';
import { ArrowLeft, ChevronRight, User, Users, Briefcase, AlertCircle } from 'lucide-react';

function PersonProfileContent() {
  const params = useParams();
  const router = useRouter();
  const personId = params?.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPerson() {
    if (!personId) return;
    setLoading(true);
    try {
      const data = await DataService.getPersonProfile(personId);
      if (data.person) {
        setPerson(data.person);
      } else {
        setError(`No person found with ID "${personId}" in the database.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching person profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPerson();

    const handleTalentSync = () => {
      loadPerson();
    };

    window.addEventListener('ultrix-talent-updated', handleTalentSync);
    window.addEventListener('focus', handleTalentSync);
    return () => {
      window.removeEventListener('ultrix-talent-updated', handleTalentSync);
      window.removeEventListener('focus', handleTalentSync);
    };
  }, [personId]);

  const handleUpdateStatus = (newStatus: Person['status']) => {
    if (person) {
      setPerson({ ...person, status: newStatus });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-slate-400">
        <span>Loading talent record telemetry for {personId}...</span>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-left text-xs">
            <div className="font-bold">Talent Record Not Found</div>
            <div className="text-slate-400 mt-0.5">{error || 'This person ID does not exist in the database.'}</div>
          </div>
        </div>

        <Link
          href="/people"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c2230] hover:bg-[#252d40] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Return to People Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link
            href="/people"
            className="hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workforce Directory</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link
            href="/recruiting/candidates"
            className="hover:text-cyan-400 transition-colors"
          >
            Candidates
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-semibold">{person.full_name}</span>
        </div>

        {/* Quick Back to Pipeline Link */}
        <div className="flex items-center gap-2">
          <Link
            href="/recruiting"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Open ATS Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Main Person Profile Component */}
      <PersonProfile
        key={person.id}
        person={person}
        onUpdatePersonStatus={handleUpdateStatus}
      />
    </div>
  );
}

export default function PersonProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-mono text-slate-500">
          Loading profile telemetry...
        </div>
      }
    >
      <PersonProfileContent />
    </Suspense>
  );
}
