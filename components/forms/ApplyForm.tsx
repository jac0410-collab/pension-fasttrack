'use client';
import { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { caseFormSchema, type CaseFormValues } from '@/lib/utils/validators';
import { Section1Business } from './Section1Business';
import { Section2Regulation } from './Section2Regulation';
import { Section3Additional } from './Section3Additional';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STEPS = ['사업장 정보', '제도 구분값', '추가정보 + 첨부파일'];

const DEFAULT_VALUES: Partial<CaseFormValues> = {
  business_type:      'corporation' as const,
  fiscal_month:       12,
  pension_type:       'DB' as const,
  providers:          ['하나은행'],
  worker_rep_type:    'majority' as const,
  enrollment_timing:  'immediate' as const,
  include_executives: false,
  coverage_period:    'afterSetup' as const,
  worker_rep_consent: false,
  payment_cycle:      'annual' as const,
};

export function ApplyForm() {
  const [step, setStep] = useState(0);
  const caseId = `C${Date.now()}`;
  const router = useRouter();

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  function handleNext() {
    if (step === 1 && !form.getValues('worker_rep_consent')) {
      toast.warning('유선 동의 확인 체크박스를 선택해주세요.');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleComplete() {
    const values = form.getValues();
    const consent  = values.doc_consent_path;
    const bizReg   = values.doc_biz_reg_path;
    if (!consent || !bizReg) {
      toast.warning('필수 첨부파일(동의서, 사업자등록증)을 모두 업로드해주세요.');
      return;
    }
    // 검토 페이지로 데이터 전달 (sessionStorage 사용)
    sessionStorage.setItem('apply_draft', JSON.stringify({ ...values, id: caseId }));
    router.push('/branch/apply/review');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 스텝퍼 헤더 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? 'text-teal-700' : i < step ? 'text-green-600' : 'text-gray-400'}>
              {i < step ? '✓ ' : ''}{i + 1}. {s}
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {/* 폼 카드 */}
      <Card>
        <CardContent className="pt-6">
          <form>
            {step === 0 && <Section1Business form={form} />}
            {step === 1 && <Section2Regulation form={form} />}
            {step === 2 && <Section3Additional form={form} caseId={caseId} />}
          </form>
        </CardContent>
      </Card>

      {/* 네비게이션 */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> 이전
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext} className="flex-1 bg-[#0D2433] hover:bg-[#00A693]">
            다음 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleComplete} className="flex-1 bg-teal-700 hover:bg-teal-800">
            입력 완료 · 검토
          </Button>
        )}
      </div>
    </div>
  );
}
