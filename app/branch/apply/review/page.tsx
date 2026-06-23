'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateReportPDF } from '@/components/pdf/generateReport';
import { generateRegulationPDF } from '@/components/pdf/generateRegulation';
import type { Case } from '@/types';
import { formatDate } from '@/lib/utils/formatters';
import { FileText, Send, ChevronLeft, Loader2 } from 'lucide-react';

export default function ReviewPage() {
  const router = useRouter();
  const supabase = createClient();
  const [draft, setDraft] = useState<(Partial<Case> & { id: string }) | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('apply_draft');
    if (!raw) { router.push('/branch/apply'); return; }
    setDraft(JSON.parse(raw));
  }, [router]);

  async function handleGeneratePDF() {
    if (!draft) return;
    setGenerating(true);
    try {
      const caseData = draft as Case;
      const [reportBlob, regulationBlob] = await Promise.all([
        generateReportPDF(caseData),
        generateRegulationPDF(caseData),
      ]);

      const uploadBlob = async (blob: Blob, path: string) => {
        const { error } = await supabase.storage
          .from('documents')
          .upload(path, blob, { contentType: 'application/pdf', upsert: true });
        if (error) throw error;
        return path;
      };

      const [reportPath, regulationPath] = await Promise.all([
        uploadBlob(reportBlob, `${draft.id}/report.pdf`),
        uploadBlob(regulationBlob, `${draft.id}/regulation.pdf`),
      ]);

      setDraft((d) => d ? { ...d, doc_report_path: reportPath, doc_regulation_path: regulationPath } : d);
      setPdfReady(true);
      toast.success('PDF 생성 및 저장 완료');
    } catch (err: any) {
      toast.error(err.message ?? 'PDF 생성 실패');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!draft || !pdfReady) return;
    setSending(true);
    try {
      const { error } = await supabase.from('cases').insert({
        ...draft,
        status:     '검토대기',
        sent_at:    new Date().toISOString(),
        delay_flag: false,
        settled:    false,
        worker_rep_consent: draft.worker_rep_consent ?? false,
      });
      if (error) throw error;
      sessionStorage.removeItem('apply_draft');
      toast.success('노무사회로 전송 완료!');
      router.push('/branch/status');
    } catch (err: any) {
      toast.error(err.message ?? '전송 실패');
    } finally {
      setSending(false);
    }
  }

  if (!draft) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> 수정
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#0D2433]">입력 내용 검토</h1>
            <p className="text-xs text-gray-500">접수번호: {draft.id}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 사업장 정보 */}
          <InfoCard title="사업장 정보">
            <Row label="사업장명" value={draft.company_name} />
            <Row label="대표자" value={draft.ceo_name} />
            <Row label="사업자등록번호" value={draft.biz_reg_no} />
            <Row label="주소" value={draft.address} />
            <Row label="근로자 수" value={`${draft.employee_count}명`} />
            <Row label="회계결산월" value={`${draft.fiscal_month}월`} />
            <Row label="사업자 구분" value={draft.business_type === 'corporation' ? '법인' : '개인사업자'} />
            <Row label="지점 / 담당자" value={`${draft.hana_branch} / ${draft.hana_manager}`} />
          </InfoCard>

          {/* 제도 구분값 */}
          <InfoCard title="제도 구분값">
            <Row label="제도형태" value={draft.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)'} />
            <Row label="제도시행일" value={formatDate(draft.start_date)} />
            <Row label="퇴직연금사업자" value={(draft.providers ?? []).join(', ')} />
            <Row label="근로자대표 유형" value={draft.worker_rep_type === 'union' ? '과반수 노조' : '근로자 과반수'} />
            <Row label="가입시점" value={draft.enrollment_timing === 'immediate' ? '입사 시 즉시' : '1년 경과시점'} />
            <Row label="임원 포함" value={draft.include_executives ? '포함' : '미포함'} />
            <Row label="유선 동의 확인" value={draft.worker_rep_consent ? '✓ 확인' : '✗ 미확인'} />
          </InfoCard>

          {/* 첨부파일 */}
          <InfoCard title="첨부파일">
            <Row label="근로자대표 동의서" value={draft.doc_consent_path ? '✓ 업로드 완료' : '미업로드'} />
            <Row label="사업자등록증" value={draft.doc_biz_reg_path ? '✓ 업로드 완료' : '미업로드'} />
          </InfoCard>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={generating || pdfReady}
            className="flex-1"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            {pdfReady ? 'PDF 생성 완료' : 'PDF 생성'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!pdfReady || sending}
            className="flex-1 bg-[#0D2433] hover:bg-[#00A693]"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            노무사회로 전송
          </Button>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-semibold text-[#0D2433]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="divide-y">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex py-1.5 gap-4">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value ?? '-'}</span>
    </div>
  );
}
