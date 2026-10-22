'use client';

import React, { useState } from 'react';
import { Person, PersonStatus, EnglishLevel, SeniorityLevel } from '@/types/database';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedPeople: Partial<Person>[]) => void;
}

export function CsvImportModal({ isOpen, onClose, onImportComplete }: CsvImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [previewData, setPreviewData] = useState<Partial<Person>[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    try {
      setError(null);
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setError('CSV must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const parsed: Partial<Person>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
        if (values.length < 2) continue;

        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        parsed.push({
          full_name: row['name'] || row['full_name'] || row['worker name'] || 'Unnamed Worker',
          email: row['email'] || `worker${i}@devlatam.io`,
          country: row['country'] || 'Argentina',
          timezone: row['timezone'] || 'America/Argentina/Buenos_Aires',
          status: (row['status'] as PersonStatus) || 'active',
          english_level: (row['english'] || row['english_level'] || 'B2') as EnglishLevel,
          seniority: (row['seniority'] || 'Senior') as SeniorityLevel,
          skills: row['skills'] ? row['skills'].split(';').map((s: string) => s.trim()) : ['React', 'TypeScript'],
        });
      }

      setPreviewData(parsed);
    } catch (err: any) {
      setError(`Failed to parse CSV: ${err.message}`);
    }
  };

  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    onImportComplete(previewData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl border border-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-base font-bold text-foreground">Import Existing Spreadsheet Data</h3>
              <p className="text-xs text-muted-foreground">
                Go-live migration: upload workers, skills, English levels, and placements.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {previewData.length === 0 ? (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors p-4 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs font-semibold text-foreground">
                Click to upload workforce CSV
              </span>
              <span className="text-[11px] text-muted-foreground mt-1">
                Expected columns: full_name, email, country, status, english_level, seniority, skills
              </span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <div>
              <span className="text-xs font-semibold text-muted-foreground">Or paste CSV raw content:</span>
              <textarea
                rows={4}
                placeholder="full_name,email,country,status,english_level,seniority,skills&#10;Julian Castro,julian@devlatam.io,Argentina,active,C1,Senior,React;Node.js"
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  parseCsv(e.target.value);
                }}
                className="w-full mt-1.5 p-2.5 rounded-md border border-input bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Detected {previewData.length} records ready to import:
              </span>
              <button
                onClick={() => setPreviewData([])}
                className="text-primary hover:underline font-semibold"
              >
                Choose another file
              </button>
            </div>

            <div className="border border-border rounded-lg max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Country</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">English</th>
                    <th className="px-3 py-2">Skills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-semibold text-foreground">{row.full_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.country}</td>
                      <td className="px-3 py-2 uppercase text-[10px] font-semibold">{row.status}</td>
                      <td className="px-3 py-2">{row.english_level}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.skills?.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={previewData.length === 0}
            onClick={handleConfirmImport}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-xs disabled:opacity-50"
          >
            Confirm & Import {previewData.length > 0 ? `(${previewData.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
