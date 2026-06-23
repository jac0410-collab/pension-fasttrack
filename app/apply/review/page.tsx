'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateReportPDF } from '@/components/pdf/generateReport';
import { generateRegulationPDF } from '@/components/pdf/generateRegulation';
import type { Case } from '@/types';
import { formatDate } from '@/lib/utils/formatters';
import { FileText, Send, ChevronLeft, Loader2, Home, CheckCircle } from 'lucide-react';

export default function ApplyReviewPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [draft,     setDraft]     = useState<(Partial<Case> & { id: string }) | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [pdfReady,  setPdfReady]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('apply_draft');
    if (!raw) { router.push('/apply'); return; }
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

      const upload = async (blob: Blob, path: string) => {
        const { error } = await supabase.storage
          .from('documents')
          .upload(path, blob, { contentType: 'application/pdf', upsert: true });
        if (error) throw error;
        return path;
      };

      const [rp, rg] = await Promise.all([
        upload(reportBlob,     `${draft.id}/report.pdf`),
        upload(regulationBlob, `${draft.id}/regulation.pdf`),
      ]);
      setDraft((d) => d ? { ...d, doc_report_path: rp, doc_regulation_path: rg } : d);
      setPdfReady(true);
      toast.success('PDF 생성 완료');
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
        status:              '검토대기',
        sent_at:             new Date().toISOString(),
        delay_flag:          false,
        settled:             false,
        worker_rep_consent:  draft.worker_rep_consent ?? false,
      });
      if (error) throw error;
      sessionStorage.removeItem('apply_draft');
      setSubmitted(true);
      toast.success('신청이 접수되었습니다!');
    } catch (err: any) {
      toast.error(err.message ?? '전송 실패');
    } finally {
      setSending(false);
    }
  }

  if (!draft) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0D2433]">신청 접수 완료</h2>
          <p className="text-gray-500 text-sm">
            당직 노무사가 서류를 검토 후 관할 노동지청에 팩스로 제출합니다.<br />
            접수번호: <strong className="font-mono">{draft.id}</strong>
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/track">
              <Button className="bg-[#00A693] hover:bg-[#007a6b]">진행현황 조회</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">홈으로</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#00A693] h-14 flex items-center px-5 gap-3">
        <Link href="/" className="text-white/70 hover:text-white"><Home className="w-4 h-4" /></Link>
        <span className="text-white/40">/</span>
        <button onClick={() => router.back()} className="text-white/70 hover:text-white text-sm">패스트트랙 신청</button>
        <span className="text-white/40">/</span>
        <span className="text-white text-sm font-medium">검토</span>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> 수정
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#0D2433]">입력 내용 검토</h1>
            <p className="text-xs text-gray-400">접수번호: {draft.id}</p>
          </div>
        </div>

        <div className="space-y-3">
          <InfoCard title="사업장 정보">
            <Row label="사업장명"       value={draft.company_name} />
            <Row label="대표자"         value={draft.ceo_name} />
            <Row label="사업자등록번호" value={draft.biz_reg_no} />
            <Row label="주소"           value={draft.address} />
            <Row label="근로자 수"      value={`${draft.employee_count}명`} />
            <Row label="지점 / 담당자"  value={`${draft.hana_branch} / ${draft.hana_manager}`} />
          </InfoCard>
          <InfoCard title="제도 구분값">
            <Row label="제도형태"   value={draft.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)'} />
            <Row label="제도시행일" value={formatDate(draft.start_date)} />
            <Row label="퇴직연금사업자" value={(draft.providers ?? []).join(', ')} />
            <Row label="유선 동의"  value={draft.worker_rep_consent ? '✓ 확인' : '✗ 미확인'} />
          </InfoCard>
          <InfoCard title="첨부파일">
            <Row label="근로자대표 동의서" value={draft.doc_consent_path ? '✓ 업로드 완료' : '미업로드'} />
            <Row label="사업자등록증"     value={draft.doc_biz_reg_path ? '✓ 업로드 완료' : '미업로드'} />
          </InfoCard>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={generating || pdfReady}
            className="flex-1"
          >
            {generating
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <FileText className="w-4 h-4 mr-2" />}
            {pdfReady ? '✓ PDF 생성됨' : 'PDF 생성'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!pdfReady || sending}
            className="flex-1 bg-[#00A693] hover:bg-[#007a6b]"
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <Send className="w-4 h-4 mr-2" />}
            노무사회로 전송
          </Button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          전송 전 PDF 생성이 필요합니다
        </p>
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
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value ?? '-'}</span>
    </div>
  );
}
