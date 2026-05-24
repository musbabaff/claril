import * as React from 'react';
import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface UploadFile {
  id: string;
  file: File;
  type: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const DOCUMENT_TYPES = [
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'tax_return', label: 'Tax Return' },
  { value: 'business_plan', label: 'Business Plan' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'contract', label: 'Contract' },
  { value: 'medical_record', label: 'Medical Record' },
  { value: 'invoice', label: 'Invoice / Billing' },
  { value: 'other', label: 'Other Document' },
];

interface DocumentUploaderProps {
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
}

export function DocumentUploader({ files, onChange }: DocumentUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndAddFiles = (selectedFiles: File[]) => {
    const validFiles: UploadFile[] = [];
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];

    if (files.length + selectedFiles.length > 10) {
      toast.error('Maximum limit of 10 documents reached.');
      return;
    }

    selectedFiles.forEach((file) => {
      // Validate Type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" rejected: Only PDF, PNG, and JPG formats are accepted.`);
        return;
      }

      // Validate Size
      if (file.size > maxFileSize) {
        toast.error(`"${file.name}" rejected: File size exceeds the 25MB limit.`);
        return;
      }

      // Check for duplicates
      if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) {
        toast.warning(`"${file.name}" is already selected.`);
        return;
      }

      validFiles.push({
        id: Math.random().toString(36).substring(7),
        file,
        type: 'other',
        progress: 0,
        status: 'idle',
      });
    });

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const updateFileType = (id: string, type: string) => {
    onChange(
      files.map((f) => (f.id === id ? { ...f, type } : f))
    );
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-[8px] p-8 text-center transition-all duration-200 cursor-pointer relative group flex flex-col items-center justify-center ${
          isDragActive
            ? 'border-brand-accent bg-[#00C8FF]/5 scale-[1.01]'
            : 'border-border-default bg-bg-surface/30 hover:border-brand-accent/50 hover:bg-bg-base/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="hidden"
        />
        <UploadCloud
          className={`h-10 w-10 mb-3 transition-colors ${
            isDragActive ? 'text-brand-accent' : 'text-text-muted group-hover:text-brand-accent/80'
          }`}
        />
        <p className="text-xs font-semibold text-text-primary">
          Drag & drop document package files here, or <span className="text-brand-accent">click to browse</span>
        </p>
        <p className="text-[10px] text-text-muted mt-1.5 font-mono">
          SUPPORTS: PDF, PNG, JPG (MAX 25MB EACH, UP TO 10 FILES)
        </p>
      </div>

      {/* Selected/Ingesting Files list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted flex justify-between items-center px-1">
            <span>Ingestion Queue ({files.length} / 10)</span>
            <span>Assign Document Class per File</span>
          </div>

          <div className="divide-y divide-border-subtle border border-border-default bg-bg-surface rounded-[8px] overflow-hidden shadow-sm">
            {files.map((fileObj) => {
              const isUploading = fileObj.status === 'uploading';
              const isSuccess = fileObj.status === 'success';
              const isError = fileObj.status === 'error';

              return (
                <div
                  key={fileObj.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface hover:bg-bg-base/20 transition-colors"
                >
                  {/* File Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded bg-bg-base border border-border-subtle text-text-secondary mt-0.5">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-text-primary truncate">
                        {fileObj.file.name}
                      </div>
                      <div className="text-[9px] text-text-muted mt-1 font-mono uppercase tracking-wide flex items-center gap-1.5">
                        <span>{formatBytes(fileObj.file.size)}</span>
                        {isUploading && (
                          <span className="text-brand-accent animate-pulse">Uploading {fileObj.progress}%</span>
                        )}
                        {isSuccess && <span className="text-success font-semibold">Ready</span>}
                        {isError && (
                          <span className="text-danger flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fileObj.error || 'Failed'}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {(isUploading || isSuccess || isError) && (
                        <div className="w-full bg-bg-base rounded-full h-1 mt-2 overflow-hidden border border-border-subtle">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isError ? 'bg-danger' : isSuccess ? 'bg-success' : 'bg-brand-accent'
                            }`}
                            style={{ width: `${fileObj.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Document Type Select & Action Button */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <select
                      value={fileObj.type}
                      disabled={isUploading || isSuccess}
                      onChange={(e) => updateFileType(fileObj.id, e.target.value)}
                      className="h-8 rounded-[6px] border border-border-default bg-bg-surface px-2.5 text-xs text-text-primary font-medium focus:outline-none focus:border-brand-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => removeFile(fileObj.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-[6px] border border-border-default bg-bg-surface text-text-muted hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
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
