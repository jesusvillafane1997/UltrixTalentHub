'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Permissions } from '@/lib/auth';
import { uploadCandidateCV, getSignedCVUrl } from '@/actions/documents';
import { Document, Person } from '@/types/database';
import { formatDate } from '@/lib/utils';
import {
  Upload,
  FileText,
  Download,
  ExternalLink,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadCVDropzoneProps {
  person: Person;
  existingDocs: Document[];
  onDocumentUploaded?: (doc: Document) => void;
}

export function UploadCVDropzone({
  person,
  existingDocs,
  onDocumentUploaded,
}: UploadCVDropzoneProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [signedUrlCountdown, setSignedUrlCountdown] = useState<{ [docId: string]: number }>({});
  const [activeSignedUrls, setActiveSignedUrls] = useState<{ [docId: string]: string }>({});

  const canUpload = Permissions.canUploadCV(currentUser.role);
  const cvDocuments = existingDocs.filter((d) => d.type === 'cv');

  const handleFileSelected = async (file: File) => {
    if (!canUpload) {
      toast.error('Permission denied: Only Admin, HR Manager, and Recruiter can upload CV documents.');
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Invalid format: Only PDF files are accepted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds maximum permitted limit of 10MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('actor_id', currentUser.id);
      formData.append('actor_role', currentUser.role);
      formData.append('cv_file', file);

      const result = await uploadCandidateCV(person.id, formData);

      if (result.success && result.document) {
        toast.success(`CV "${file.name}" uploaded successfully!`, {
          description: 'Document stored in encrypted Supabase storage bucket documents.',
        });

        if (onDocumentUploaded) {
          onDocumentUploaded(result.document);
        }
      } else {
        toast.error(result.error || 'Failed to upload CV.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while uploading CV.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleGenerateSignedUrl = async (docId: string, filePath: string, fileName: string) => {
    try {
      const result = await getSignedCVUrl(filePath, 60);

      if (result.success && result.signedUrl) {
        setActiveSignedUrls((prev) => ({ ...prev, [docId]: result.signedUrl! }));
        setSignedUrlCountdown((prev) => ({ ...prev, [docId]: 60 }));

        const timer = setInterval(() => {
          setSignedUrlCountdown((prev) => {
            const count = prev[docId];
            if (!count || count <= 1) {
              clearInterval(timer);
              const next = { ...prev };
              delete next[docId];
              return next;
            }
            return { ...prev, [docId]: count - 1 };
          });
        }, 1000);

        toast.success(`Temporary access token generated for ${fileName}`, {
          description: 'Link is active for 60 seconds.',
        });

        // Open in new tab or trigger download
        window.open(result.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(result.error || 'Unable to generate signed URL.');
      }
    } catch (err: any) {
      toast.error('Error issuing temporary access token.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone Card */}
      <div className="p-5 rounded-2xl bg-[#181d29] border border-white/[0.1] shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-slate-100 tracking-tight">Curriculum Vitae (CV) Ingestion</h4>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Private Vault
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">PDF • Max 10MB</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          disabled={!canUpload || isUploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileSelected(f);
          }}
          className="hidden"
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (canUpload && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f && canUpload && !isUploading) handleFileSelected(f);
          }}
          onClick={() => {
            if (canUpload && !isUploading) fileInputRef.current?.click();
          }}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 group',
            !canUpload
              ? 'opacity-60 cursor-not-allowed border-white/5 bg-[#141822]'
              : isDragging
              ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-pointer'
              : 'border-white/[0.12] hover:border-cyan-400/50 bg-[#141822]/70 hover:bg-[#141822] cursor-pointer'
          )}
        >
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 group-hover:scale-110 transition-transform">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              {isUploading
                ? 'Encrypting & uploading CV to Supabase storage...'
                : canUpload
                ? 'Click or drag PDF here to upload CV'
                : 'Role Restricted: Contact HR or Recruiter to upload documents'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Files are stored privately in <code>cvs/{person.id}/...</code> and accessed via temporary 60s signed tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Existing CV Documents List */}
      {cvDocuments.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
            Registered CV Documents ({cvDocuments.length})
          </div>

          <div className="space-y-2">
            {cvDocuments.map((doc) => {
              const countdown = signedUrlCountdown[doc.id];
              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl bg-[#181d29] border border-white/[0.08] hover:border-cyan-400/40 transition-all flex items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate flex items-center gap-2">
                        <span>{doc.file_name}</span>
                        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          CV
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB • ` : ''}
                        Uploaded {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleGenerateSignedUrl(doc.id, doc.file_path, doc.file_name)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer',
                        countdown
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] animate-pulse'
                          : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60'
                      )}
                    >
                      {countdown ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Signed Link ({countdown}s)</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>View / Download CV (60s URL)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
