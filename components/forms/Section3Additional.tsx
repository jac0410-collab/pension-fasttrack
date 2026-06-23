'use client';
import { useState } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import type { CaseFormValues } from '@/lib/utils/validators';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CaseFormValues, any, any>;
  caseId: string;
}

type FileKey = 'doc_consent_path' | 'doc_biz_reg_path';

const FILE_FIELDS: { key: FileKey; label: string; accept: string }[] = [
  { key: 'doc_consent_path', label: '근로자대표 동의서 *', accept: 'application/pdf,image/*' },
  { key: 'doc_biz_reg_path', label: '사업자등록증 *',     accept: 'application/pdf,image/*' },
];

export function Section3Additional({ form, caseId }: Props) {
  const { register, watch, setValue } = form;
  const [uploading, setUploading] = useState<Partial<Record<FileKey, boolean>>>({});
  const supabase = createClient();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, key: FileKey) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [key]: true }));
    try {
      const ext = file.name.split('.').pop();
      const folder = key === 'doc_consent_path' ? 'consent' : 'biz_reg';
      const path = `${caseId}/${folder}.${ext}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: true });

      if (error) throw error;
      setValue(key, path);
      toast.success(`${key === 'doc_consent_path' ? '동의서' : '사업자등록증'} 업로드 완료`);
    } catch (err: any) {
      toast.error(err.message ?? '업로드 실패');
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-[#0D2433] border-b pb-2">신고서 추가정보 + 첨부파일</h3>
      <p className="text-xs text-gray-500">선택 항목은 미입력 시 신고서 해당란이 공란으로 생성됩니다 (수기 기입 가능).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="업종(주산품)">
          <Input placeholder="예: 소프트웨어 개발" {...register('industry')} />
        </Field>
        <Field label="전화번호">
          <Input placeholder="02-0000-0000" {...register('phone')} />
        </Field>
        <Field label="팩스(Fax)번호">
          <Input placeholder="02-0000-0000" {...register('fax_number')} />
        </Field>
        <Field label="의견청취일 또는 동의일">
          <Input type="date" {...register('opinion_date')} />
        </Field>
        <Field label="관할 지방고용노동청(지청)">
          <Input placeholder="예: 서울지방고용노동청" {...register('labor_office')} />
        </Field>
      </div>

      {/* 첨부파일 업로드 */}
      <div className="space-y-4 pt-2">
        <h4 className="font-medium text-gray-800">필수 첨부파일</h4>
        {FILE_FIELDS.map(({ key, label, accept }) => {
          const uploaded = !!watch(key);
          const isUploading = uploading[key];
          return (
            <div key={key} className={`border-2 rounded-lg p-4 transition-colors ${
              uploaded ? 'border-green-300 bg-green-50' : 'border-dashed border-gray-300'
            }`}>
              <Label className="text-sm font-medium">{label}</Label>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploaded
                      ? 'bg-green-600 text-white'
                      : 'bg-[#0D2433] text-white hover:bg-[#00A693]'
                  }`}>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : uploaded ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? '업로드 중...' : uploaded ? '업로드 완료' : '파일 선택'}
                  </div>
                  <input
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, key)}
                  />
                </label>
                <span className="text-xs text-gray-500">PDF / JPG / PNG</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );
}
