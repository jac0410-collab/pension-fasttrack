'use client';
import { type UseFormReturn } from 'react-hook-form';
import type { CaseFormValues } from '@/lib/utils/validators';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignatureCanvas } from './SignatureCanvas';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CaseFormValues, any, any>;
  caseId: string;
}

export function Section3Additional({ form }: Props) {
  const { register, setValue, watch } = form;
  const signatureData = watch('signature_data');

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-[#0D2433] border-b pb-2">신고서 추가정보</h3>
      <p className="text-xs text-gray-500">미입력 시 신고서 해당란이 공란으로 생성됩니다 (수기 기입 가능).</p>

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

      {/* 서명 */}
      <div className="space-y-2 pt-2 border-t">
        <Label className="text-sm font-semibold text-[#0D2433]">
          대표자 서명 <span className="text-gray-400 font-normal">(선택 — PDF 서명란에 자동 삽입)</span>
        </Label>
        <p className="text-xs text-gray-500">아래 흰 칸에 마우스(또는 손가락)로 서명하세요.</p>
        <SignatureCanvas
          value={signatureData}
          onChange={(data) => setValue('signature_data', data)}
        />
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
