'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { CaseTable } from '@/components/cases/CaseTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FlowBanner } from '@/components/cases/FlowBanner';
import { Search } from 'lucide-react';
import type { Case } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils/formatters';
import { startOfMonth } from 'date-fns';

export default function HQDashboardPage() {
  const supabase  = createClient();
  const [cases,   setCases]  = useState<Case[]>([]);
  const [search,  setSearch] = useState('');
  const [selected, setSelected] = useState<Case | null>(null);
  const [loading,  setLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('cases').select('*').order('sent_at', { ascending: false });
    if (search.trim()) {
      query = query.or(`company_name.ilike.%${search}%,biz_reg_no.ilike.%${search}%`);
    }
    const { data } = await query;
    setCases((data as Case[]) ?? []);
    setLoading(false);
  }, [supabase, search]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const total        = cases.length;
  const pending      = cases.filter((c) => c.status === '검토대기').length;
  const completed    = cases.filter((c) => c.status === '신고완료').length;
  const monthStart   = startOfMonth(new Date()).toISOString();
  const thisMonth    = cases.filter((c) => c.completed_at && c.completed_at >= monthStart).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">전체 현황</h1>
          <p className="text-sm text-gray-500 mt-1">하나은행 본점 — 읽기 전용</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard label="전체 접수"     value={total}     />
          <KPICard label="검토 대기"     value={pending}   color="text-blue-700"  />
          <KPICard label="신고 완료"     value={completed} color="text-green-700" />
          <KPICard label="이번달 처리"   value={thisMonth} color="text-teal-700"  />
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="사업장명 또는 사업자번호"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">로딩 중...</div>
        ) : (
          <CaseTable cases={cases} showLawyer onRowClick={(c) => setSelected(c)} />
        )}
      </main>

      {/* 상세 다이얼로그 (읽기 전용) */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected.company_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FlowBanner status={selected.status} />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Row label="사업자번호" value={selected.biz_reg_no} />
                <Row label="제도형태"   value={selected.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)'} />
                <Row label="제도시행일" value={formatDate(selected.start_date)} />
                <Row label="지점"       value={`${selected.hana_branch} / ${selected.hana_manager}`} />
                <Row label="전송일시"   value={formatDateTime(selected.sent_at)} />
                <Row label="팩스제출"   value={formatDateTime(selected.fax_submitted_at)} />
                <Row label="완료일시"   value={formatDateTime(selected.completed_at)} />
                {selected.rejection_reason && <Row label="반려사유" value={selected.rejection_reason} />}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function KPICard({ label, value, color = 'text-[#0D2433]' }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800">{value ?? '-'}</p>
    </div>
  );
}
