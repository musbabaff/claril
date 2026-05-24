'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { DocumentUploader, UploadFile } from '@/components/cases/document-uploader';
import { VoiceIntake } from '@/components/cases/voice-intake';

const caseSchema = z.object({
  subjectName: z.string().min(2, 'Subject name must be at least 2 characters'),
  caseReference: z.string().optional(),
  primaryValue: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
  description: z.string().optional(),
});

type CaseFormValues = z.infer<typeof caseSchema>;

export default function NewCaseWizard() {
  const router = useRouter();
  const supabase = createClient();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
  });

  const [lang, setLang] = useState('English');

  useEffect(() => {
    const syncLang = () => {
      const saved = localStorage.getItem('claril_lang') || 'EN';
      if (saved === 'AZ') setLang('Azerbaijani');
      else if (saved === 'TR') setLang('Turkish');
      else setLang('English');
    };
    syncLang();
    window.addEventListener('claril_lang_change', syncLang);
    return () => window.removeEventListener('claril_lang_change', syncLang);
  }, []);

  const handleVoiceParse = (fields: {
    subject_name: string;
    primary_value: number;
    description: string;
    case_reference: string;
  }) => {
    if (fields.subject_name) setValue('subjectName', fields.subject_name);
    if (fields.case_reference) setValue('caseReference', fields.case_reference);
    if (fields.primary_value) setValue('primaryValue', fields.primary_value);
    if (fields.description) setValue('description', fields.description);
  };

  const onSubmit = async (values: CaseFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication session not found.');
        return;
      }

      // 1. Create Case row via API
      const caseResponse = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: values.subjectName,
          caseReference: values.caseReference || null,
          primaryValue: values.primaryValue ?? null,
          description: values.description || null,
        }),
      });

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json();
        throw new Error(errorData.error || 'Failed to create case container.');
      }

      const caseRecord = await caseResponse.json();
      const caseId = caseRecord.id;

      // 2. Upload documents if present
      if (files.length > 0) {
        // Set all files as uploading
        const updatedFiles = files.map((f) => ({
          ...f,
          status: 'uploading' as const,
          progress: 5,
        }));
        setFiles(updatedFiles);

        // Upload loop
        for (let i = 0; i < updatedFiles.length; i++) {
          const fileObj = updatedFiles[i];
          const fileName = fileObj.file.name;
          const storagePath = `${user.id}/${caseId}/${fileName}`;

          // Simulate visual progress increments
          let progress = 10;
          const progressInterval = setInterval(() => {
            progress = Math.min(progress + 15, 90);
            setFiles((prev) =>
              prev.map((f) => (f.id === fileObj.id ? { ...f, progress } : f))
            );
          }, 200);

          try {
            // Real Supabase storage upload
            const { error: uploadError } = await supabase.storage
              .from('case-documents')
              .upload(storagePath, fileObj.file, {
                cacheControl: '3600',
                upsert: true,
              });

            clearInterval(progressInterval);

            if (uploadError) throw uploadError;

            // Update file progress to 100% on upload completion
            setFiles((prev) =>
              prev.map((f) => (f.id === fileObj.id ? { ...f, progress: 100 } : f))
            );

            // 3. Insert Document metadata row via API
            const docResponse = await fetch(`/api/cases/${caseId}/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filePath: storagePath,
                documentType: fileObj.type,
                originalFilename: fileName,
                fileSizeBytes: fileObj.file.size,
              }),
            });

            if (!docResponse.ok) {
              const docErrorData = await docResponse.json();
              throw new Error(docErrorData.error || 'Failed to register document metadata.');
            }

            // Set success state
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileObj.id ? { ...f, status: 'success' as const, progress: 100 } : f
              )
            );
          } catch (err) {
            clearInterval(progressInterval);
            const errMsg = err instanceof Error ? err.message : 'Upload failed';
            console.error(`Error uploading file ${fileName}:`, err);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileObj.id
                  ? { ...f, status: 'error' as const, progress: 0, error: errMsg }
                  : f
              )
            );
            throw new Error(`Failed uploading "${fileName}": ${errMsg}`);
          }
        }
      }

      toast.success('Document case successfully created!');
      router.push(`/dashboard/cases/${caseId}`);
      router.refresh();
    } catch (err) {
      console.error('Case creation error:', err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during case setup.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/cases"
          className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border-default bg-bg-surface text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-xs font-mono text-text-secondary uppercase">Back to Cases Ledger</span>
      </div>

      <div className="border border-border-default bg-bg-surface rounded-[8px] overflow-hidden shadow-sm p-6 sm:p-8">
        <div>
          <h2 className="font-sans text-xl font-semibold tracking-tight text-text-primary">Create Ingestion Case</h2>
          <p className="text-xs text-text-secondary mt-1">Setup the universal workflow metadata and package your processing files.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          
          {/* Voice Intake Assistant */}
          <VoiceIntake onParse={handleVoiceParse} language={lang} />

          {/* Metadata Section */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="subjectName" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Subject Entity Name
              </label>
              <input
                id="subjectName"
                type="text"
                {...register('subjectName')}
                placeholder="Subject entity or project name"
                className="mt-2 block w-full h-10 px-3 rounded-[6px] border border-border-default bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
              {errors.subjectName && (
                <p className="mt-1 font-mono text-[11px] text-danger">{errors.subjectName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="caseReference" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Case Reference ID (Optional)
              </label>
              <input
                id="caseReference"
                type="text"
                {...register('caseReference')}
                placeholder="REF-89410A"
                className="mt-2 block w-full h-10 px-3 rounded-[6px] border border-border-default bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="primaryValue" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Ingestion Value / Metric (Optional)
              </label>
              <input
                id="primaryValue"
                type="number"
                step="any"
                {...register('primaryValue')}
                placeholder="500000.00"
                className="mt-2 block w-full h-10 px-3 rounded-[6px] border border-border-default bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-brand-accent transition-colors font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Workflow Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                placeholder="Provide reasoning, compliance rules, or analysis targets..."
                className="mt-2 block w-full p-3 rounded-[6px] border border-border-default bg-bg-surface text-text-primary text-sm focus:outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
          </div>

          {/* Document Ingestion Dropzone */}
          <div className="pt-6 border-t border-border-subtle">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Package Document Uploads
            </label>
            <DocumentUploader files={files} onChange={setFiles} />
          </div>

          {/* Action Trigger Buttons */}
          <div className="pt-6 border-t border-border-subtle flex justify-end gap-3">
            <Link
              href="/dashboard/cases"
              className="inline-flex h-10 items-center justify-center rounded-[6px] border border-border-default bg-bg-surface px-6 font-semibold text-text-secondary hover:bg-bg-base hover:text-text-primary transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-[6px] bg-brand-accent text-bg-base px-6 font-semibold hover:opacity-90 transition-opacity gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing uploads...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Ingest & Parse Case</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
