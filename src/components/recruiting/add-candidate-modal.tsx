'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { createCandidate } from '@/actions/candidates';
import { DataService } from '@/lib/data-service';
import { Person, Application, Document, Opening, EnglishLevel, SeniorityLevel } from '@/types/database';
import {
  X,
  UserPlus,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Briefcase,
  Globe,
  Clock,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  User,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOpeningId?: string;
  onCandidateCreated?: (candidate: Person, application?: Application, document?: Document) => void;
}

const COMMON_SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'Node.js',
  'Python',
  'Django',
  'FastAPI',
  'AWS',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'GraphQL',
  'Tailwind',
];

const COUNTRY_TIMEZONES: Record<string, string> = {
  Argentina: 'America/Argentina/Buenos_Aires (ART)',
  Colombia: 'America/Bogota (COT)',
  Brazil: 'America/Sao_Paulo (BRT)',
  Chile: 'America/Santiago (CLT)',
  Uruguay: 'America/Montevideo (UYT)',
  Mexico: 'America/Mexico_City (CST)',
  Peru: 'America/Lima (PET)',
  'United States': 'America/New_York (EST)',
  Canada: 'America/Toronto (EST)',
  Other: 'UTC',
};

export function AddCandidateModal({
  isOpen,
  onClose,
  defaultOpeningId,
  onCandidateCreated,
}: AddCandidateModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Argentina');
  const [timezone, setTimezone] = useState(COUNTRY_TIMEZONES['Argentina']);
  const [seniority, setSeniority] = useState<SeniorityLevel>('Senior');
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>('B2');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [skillInput, setSkillInput] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [selectedOpeningId, setSelectedOpeningId] = useState<string>(
    defaultOpeningId || 'talent_pool'
  );
  const [source, setSource] = useState('LinkedIn Sourcing');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    DataService.getOpenings().then((ops) => {
      if (isMounted) {
        setOpenings(ops);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (defaultOpeningId) {
      setSelectedOpeningId(defaultOpeningId);
    }
  }, [defaultOpeningId]);

  useEffect(() => {
    if (isOpen) {
      if (defaultOpeningId) {
        setSelectedOpeningId(defaultOpeningId);
      } else {
        setSelectedOpeningId('talent_pool');
      }
    }
  }, [isOpen, defaultOpeningId]);

  if (!isOpen) return null;

  const canAdd = Permissions.canAddCandidate(currentUser.role);

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setTimezone(COUNTRY_TIMEZONES[c] || 'UTC');
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Invalid format: Only PDF files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds maximum size limit of 10MB.');
      return;
    }
    setSelectedFile(file);
    toast.success(`CV attached: ${file.name}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAdd) {
      toast.error('Permission denied: Only Admin, HR Manager, and Recruiter can add candidates.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter candidate full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('actor_id', currentUser.id);
      formData.append('actor_role', currentUser.role);
      formData.append('full_name', fullName.trim());
      formData.append('email', email.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      formData.append('country', country);
      formData.append('timezone', timezone);
      formData.append('seniority', seniority);
      formData.append('english_level', englishLevel);
      formData.append('skills', JSON.stringify(skills));
      if (linkedinUrl.trim()) formData.append('linkedin_url', linkedinUrl.trim());
      if (salaryExpectation.trim()) formData.append('salary_expectation', salaryExpectation.trim());
      if (availabilityDate.trim()) formData.append('availability_date', availabilityDate.trim());
      
      const finalOpeningId =
        defaultOpeningId ||
        (selectedOpeningId && selectedOpeningId !== 'talent_pool' ? selectedOpeningId : null);
      if (finalOpeningId) {
        formData.append('opening_id', finalOpeningId);
      }
      formData.append('source', source);

      if (selectedFile) {
        formData.append('cv_file', selectedFile);
      }

      const result = await createCandidate(formData);

      if (result.success && result.candidate) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        toast.success(`Candidate ${result.candidate.full_name} created successfully!`, {
          description: selectedOpeningId !== 'talent_pool'
            ? 'Added to opening pipeline in Applied stage.'
            : 'Added to Talent Pool directory.',
        });

        if (onCandidateCreated) {
          onCandidateCreated(result.candidate, result.application, result.document);
        }

        onClose();
      } else {
        toast.error(result.error || 'Failed to create candidate.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#141824]/95 border border-white/[0.14] rounded-2xl shadow-2xl overflow-hidden z-10 backdrop-blur-2xl my-8 max-h-[90vh] flex flex-col"
        >
          {/* Top specular highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.1] bg-[#181d29]/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Add Candidate to Talent Hub</span>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    ATS Ingestion
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Direct candidate registration with automatic pipeline routing and encrypted CV storage.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
            {/* Opening Routing Selector */}
            <div className="p-4 rounded-xl bg-[#181d29] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Opening / Pipeline:</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Direct stage: <strong className="text-cyan-300">Applied (Stage 1)</strong>
                </span>
              </div>

              {defaultOpeningId ? (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                        Bound to Active Opening
                      </div>
                      <div className="text-xs font-bold text-white">
                        {openings.find((o) => o.id === defaultOpeningId)?.title || 'Current Opening Pipeline'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    Applied Column
                  </span>
                </div>
              ) : (
                <select
                  value={selectedOpeningId}
                  onChange={(e) => setSelectedOpeningId(e.target.value)}
                  className="w-full h-9 rounded-xl bg-[#131620] border border-white/[0.12] px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="talent_pool">— Talent Pool (General Pool, No Active Job) —</option>
                  {openings.map((op) => {
                    const clientName = (op as any).clients?.name || 'Direct';
                    return (
                      <option key={op.id} value={op.id}>
                        {op.title} • {clientName} ({op.seniority})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Core Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mariana Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="mariana.silva@latamdev.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Phone & LinkedIn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="+54 9 11 5555 4444"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Location & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Country <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full h-9 rounded-xl bg-[#181d29] border border-white/[0.1] px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  {Object.keys(COUNTRY_TIMEZONES).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Timezone <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Seniority & English Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Seniority Level <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                  className="w-full h-9 rounded-xl bg-[#181d29] border border-white/[0.1] px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="Junior">Junior</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  English Level <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={englishLevel}
                  onChange={(e) => setEnglishLevel(e.target.value as EnglishLevel)}
                  className="w-full h-9 rounded-xl bg-[#181d29] border border-white/[0.1] px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="B1">B1 — Intermediate</option>
                  <option value="B2">B2 — Upper Intermediate</option>
                  <option value="C1">C1 — Advanced / Fluent</option>
                  <option value="C2">C2 — Mastery</option>
                  <option value="Native">Native Speaker</option>
                </select>
              </div>
            </div>

            {/* Skills Tag Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Skills & Technologies <span className="text-cyan-400">*</span>
              </label>

              {/* Current tags */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#181d29] border border-white/[0.1] min-h-[42px] items-center">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  placeholder="Type skill & press Enter..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddSkill(skillInput);
                    }
                  }}
                  className="bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none flex-1 min-w-[140px] px-1"
                />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500">Popular:</span>
                {COMMON_SKILLS.filter((s) => !skills.includes(s)).slice(0, 7).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/5 transition-colors cursor-pointer"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Compensation & Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Salary Expectation (USD / Month)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 5000"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Earliest Availability Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={availabilityDate}
                    onChange={(e) => setAvailabilityDate(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#181d29] border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Candidate Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#181d29] border border-white/[0.1] px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="LinkedIn Sourcing">LinkedIn Sourcing</option>
                <option value="Direct Inbound Application">Direct Inbound Application</option>
                <option value="Employee Referral">Employee Referral</option>
                <option value="Talent Community">Talent Community</option>
                <option value="Agency Partner">Agency Partner</option>
                <option value="Recruiter Outreach">Recruiter Outreach</option>
              </select>
            </div>

            {/* CV Dropzone / File Picker */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Candidate Curriculum Vitae (CV)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">PDF only • Max 10MB</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group',
                    isDragging
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_16px_rgba(0,240,255,0.2)]'
                      : 'border-white/[0.12] hover:border-cyan-400/50 bg-[#181d29]/60 hover:bg-[#1a202d]'
                  )}
                >
                  <div className="p-2.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      Click to browse or drag and drop candidate CV
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Encrypted upload to Supabase private storage bucket <code>documents</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-[0_0_12px_rgba(0,240,255,0.1)]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {selectedFile.name}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300">
                        {Math.round(selectedFile.size / 1024)} KB • Ready for upload
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-white/[0.1] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer',
                  isSubmitting
                    ? 'bg-[#1e2330] text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 text-slate-950 font-black shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_28px_rgba(0,240,255,0.5)] hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Registering Candidate...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Candidate & Add to ATS</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
