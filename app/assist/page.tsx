'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { caseFormSchema, type CaseFormValues } from '@/lib/utils/validators';
import { Section1Business } from '@/components/forms/Section1Business';
import { Section2Regulation } from '@/components/forms/Section2Regulation';
import { Section3Additional } from '@/components/forms/Section3Additional';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, FileDown, Loader2, Home } from 'lucide-react';
import { generateCombinedPDF } from '@/components/pdf/generateCombined';
import type { Case } from '@/types';

const STEPS = ['사업장 정보', '제도 구분값', '추가정보'];

export default function AssistPage() {
  const [step,      setStep]      = useState(0);
  const [generating, setGenerating] = useState(false);
  const [done,      setDone]      = useState(false);

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
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
    },
    mode: 'onChange',
  });

  function handleNext() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleGenerate() {
    const values = form.getValues();
    // 필수 항목 검증
    const required: (keyof CaseFormValues)[] = ['company_name', 'biz_reg_no', 'ceo_name', 'address'];
    const missing = required.filter((k) => !values[k]);
    if (missing.length > 0) { toast.error('1단계 필수 항목을 먼저 입력해주세요.'); return; }

    setGenerating(true);
    try {
      const caseData = { ...values, id: `C${Date.now()}`, status: '검토대기', delay_flag: false, settled: false, worker_rep_consent: values.worker_rep_consent ?? false, sent_at: new Date().toISOString() } as unknown as Case;

      const combinedBlob = await generateCombinedPDF(caseData);

      // 브라우저 다운로드 (신고서 + 규약 통합 1파일)
      const dl = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      };

      dl(combinedBlob, `퇴직연금규약_${values.company_name}.pdf`);

      setDone(true);
      toast.success('PDF가 다운로드되었습니다. (신고서 + 규약 통합)');
    } catch (err: any) {
      toast.error(err.message ?? 'PDF 생성 실패');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <header className="bg-[#0D2433] h-14 flex items-center px-5 gap-3">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white text-sm font-medium">규약 및 신고서 작성 도우미</span>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">퇴직연금 규약 및 신고서 작성</h1>
          <p className="text-sm text-gray-500 mt-1">사업장 정보를 입력하면 규약 전문과 신고서 PDF를 자동 생성합니다.</p>
        </div>

        {/* 스텝퍼 */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            {STEPS.map((s, i) => (
              <span key={s} className={
                i === step ? 'text-teal-700' : i < step ? 'text-green-600' : 'text-gray-400'
              }>
                {i < step ? '✓ ' : ''}{i + 1}. {s}
              </span>
            ))}
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-6">
            {step === 0 && <Section1Business form={form} />}
            {step === 1 && <Section2Regulation form={form} />}
            {step === 2 && (
              <Section3Additional
                form={form}
                caseId={`draft_${Date.now()}`}
              />
            )}
          </CardContent>
        </Card>

        {/* 네비게이션 */}
        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> 이전
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="flex-1 bg-[#0D2433] hover:bg-[#00A693]">
              다음 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 bg-[#00A693] hover:bg-[#007a6b] text-white"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />생성 중...</>
                : <><FileDown className="w-4 h-4 mr-2" />PDF 생성 및 다운로드</>
              }
            </Button>
          )}
        </div>

        {done && (
          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-800">
            ✓ 신고서 + 규약이 하나의 PDF로 다운로드되었습니다.<br />
            패스트트랙 서비스를 이용하시려면{' '}
            <Link href="/apply" className="font-semibold underline">패스트트랙 신청</Link>
            으로 이동하세요.
          </div>
        )}
      </main>
    </div>
  );
}
