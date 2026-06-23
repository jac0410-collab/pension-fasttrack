'use client';
import { type UseFormReturn } from 'react-hook-form';
import type { CaseFormValues } from '@/lib/utils/validators';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignatureCanvas } from './SignatureCanvas';
import { formatBizRegNo } from '@/lib/utils/formatters';
import { Info } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props { form: UseFormReturn<CaseFormValues, any, any> }

export function Section1Business({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const bizType = watch('business_type');

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-[#0D2433] border-b pb-2">사업장 정보</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="사업장명 *" error={errors.company_name?.message}>
          <Input placeholder="사업자등록증의 상호명" {...register('company_name')} />
        </Field>
        <Field label="대표자 성명 *" error={errors.ceo_name?.message}>
          <Input placeholder="대표자 이름" {...register('ceo_name')} />
        </Field>
        <Field label="사업자등록번호 *" error={errors.biz_reg_no?.message}>
          <Input
            placeholder="000-00-00000"
            maxLength={12}
            {...register('biz_reg_no')}
            onChange={(e) => setValue('biz_reg_no', formatBizRegNo(e.target.value))}
          />
        </Field>
        <Field label="대표자 연락처">
          <Input placeholder="010-0000-0000" {...register('ceo_phone')} />
        </Field>
      </div>

      <Field label="주소 *" error={errors.address?.message}>
        <Input placeholder="사업자등록증상 본점 소재지" {...register('address')} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="상시 근로자 수 *" error={errors.employee_count?.message}>
          <Input type="number" min={1} {...register('employee_count')} />
        </Field>
        <Field label="회계 결산월 *" error={errors.fiscal_month?.message}>
          <Select onValueChange={(v) => setValue('fiscal_month', Number(v))} defaultValue="12">
            <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}월</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* 사업자 구분 */}
      <div>
        <Label className="text-sm font-medium">사업자 구분 *</Label>
        <div className="flex gap-3 mt-2">
          {(['corporation', 'individual'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('business_type', t)}
              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                bizType === t
                  ? 'border-[#00A693] bg-teal-50 text-teal-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {t === 'corporation' ? '법인' : '개인사업자'}
            </button>
          ))}
        </div>
        {bizType === 'corporation' && (
          <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-700 text-xs p-2 rounded">
            <Info className="w-3.5 h-3.5 shrink-0" />
            법인사업자는 규약 출력 후 법인 도장을 날인하여 제출하세요.
          </div>
        )}
        {bizType === 'individual' && (
          <div className="mt-3">
            <Label className="text-sm font-medium">대표자 전자서명</Label>
            <SignatureCanvas
              value={watch('signature_data')}
              onChange={(v) => setValue('signature_data', v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
