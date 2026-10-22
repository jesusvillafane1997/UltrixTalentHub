'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { uploadContract } from '@/actions/contracts';
import { DataService } from '@/lib/data-service';
import { Client, ContractType, ContractStatus } from '@/types/database';
import {
  FileText,
  Upload,
  Calendar,
  Building2,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  onContractUploaded?: (contract: any) => void;
}

export function UploadContractDialog({
  isOpen,
  onClose,
  personId,
  personName,
  onContractUploaded,
}: UploadContractDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [type, setType] = useState<ContractType>('contractor_agreement');
  const [status, setStatus] = useState<ContractStatus>('Signed');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [signedDate, setSignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    DataService.getClients()
      .then((cls) => {
        if (isMounted) setClients(cls || []);
      })
      .catch((err) => {
        console.error('Failed to load clients for contracts dialog:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only PDF documents are allowed for contracts.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Contract file exceeds the maximum 15MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      toast.error('Start date is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('person_id', personId);
      formData.append('type', type);
      formData.append('status', status);
      if (clientId) formData.append('client_id', clientId);
      formData.append('start_date', startDate);
      if (endDate) formData.append('end_date', endDate);
      if (signedDate) formData.append('signed_date', signedDate);
      if (selectedFile) formData.append('contract_file', selectedFile);

      const res = await uploadContract(formData);

      if (res.success) {
        toast.success(`Contract uploaded for ${personName}!`, {
          description: `${type.replace(/_/g, ' ').toUpperCase()} (${status}) registered on file.`,
        });

        if (res.activeGatePassed) {
          toast.info('Active Gate Verified!', {
            description: 'Both Contractor Agreement and NDA are now signed and verified.',
          });
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ultrix-talent-updated'));
        }

        if (onContractUploaded) {
          onContractUploaded(res.contract);
        }

        onClose();
      } else {
        toast.error(res.error || 'Failed to upload contract.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSubmitting ? undefined : onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#141824] border border-white/[0.14] rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Upload Legal Contract</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Agreements &amp; NDAs for <span className="text-slate-200 font-semibold">{personName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Agreement Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Contract Agreement Type *</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ContractType)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                >
                  <option value="contractor_agreement">Contractor Agreement (MSA)</option>
                  <option value="nda">Mutual NDA</option>
                  <option value="client_sow">Client SOW (Schedule A)</option>
                  <option value="amendment">Contract Amendment</option>
                  <option value="termination">Termination Notice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Signing Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                >
                  <option value="Signed">Signed (Active)</option>
                  <option value="Sent">Sent (Out for Signature)</option>
                  <option value="Draft">Draft</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            {/* Optional Client Association (e.g. for SOWs) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Associated Client (Optional)</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="">General / Direct Ultrix Contract</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates: Start Date, End Date (Expiry alerts), Signed Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expiry Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                  title="Used for automated 30-day and 7-day expiration telemetry alerts."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Signed Date</span>
                </label>
                <input
                  type="date"
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0e121a] border border-white/[0.12] text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer font-mono"
                />
              </div>
            </div>

            {/* Contract PDF File Picker */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Signed PDF Agreement (Max 15MB)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'p-4 rounded-xl border border-dashed transition-all flex items-center justify-between gap-3 cursor-pointer group',
                  selectedFile
                    ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15'
                    : 'border-white/15 bg-[#0e121a] hover:border-cyan-400/50 hover:bg-white/[0.02]'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                      selectedFile
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-slate-400 group-hover:text-cyan-400'
                    )}
                  >
                    {selectedFile ? (
                      <FileCheck className="w-5 h-5" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">
                      {selectedFile ? selectedFile.name : 'Select or drop PDF document here'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for secure storage`
                        : 'PDF format only • Bilateral signature records'}
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expiry alerts notice */}
            {endDate && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2 text-[11px] font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Contract expiration set for <strong>{endDate}</strong>. Automated alerts will fire at 30 days and 7 days prior to expiry.
                </span>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 flex items-center gap-2 transition-all shadow-md shadow-cyan-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Contract...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Save &amp; Register Contract</span>
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
