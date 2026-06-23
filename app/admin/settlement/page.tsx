'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Send } from 'lucide-react';
import type { Case, Settlement } from '@/types';
import { formatDate, formatDateTime, formatAmount } from '@/lib/utils/formatters';
import { format } from 'date-fns';

export default function AdminSettlementPage() {
  const supabase    = createClient();
  const [pending,   setPending]   = useState<Case[]>([]);
  const [history,   setHistory]   = useState<Settlement[]>([]);
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('cases').select('*').eq('status', '신고완료').eq('settled', false),
      supabase.from('settlements').select('*').order('requested_at', { ascending: false }),
    ]);
    setPending((c as Case[]) ?? []);
    setHistory((s as Settlement[]) ?? []);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRequestSettlement() {
    if (pending.length === 0) { toast.warning('정산 대기 건이 없습니다.'); return; }
    setRequesting(true);
    try {
      const yearMonth = format(new Date(), 'yyyy-MM');
      const caseIds   = pending.map((c) => c.id);
      const total     = pending.length * 30000;

      const { error: sErr } = await supabase.from('settlements').insert({
        year_month:   yearMonth,
        case_ids:     caseIds,
        total_count:  pending.length,
        total_amount: total,
        status:       'requested',
      });
      if (sErr) throw sErr;

      // 정산 처리된 건들 settled = true
      const { error: cErr } = await supabase.from('cases')
        .update({ settled: true })
        .in('id', caseIds);
      if (cErr) throw cErr;

      toast.success(`${pending.length}건 정산 신청 완료 (${formatAmount(total)})`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRequesting(false);
    }
  }

  async function handleExcel() {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.json_to_sheet(pending.map((c) => ({
      '사업장명':    c.company_name,
      '사업자번호':  c.biz_reg_no,
      '완료일':      formatDate(c.completed_at),
      '수수료(원)':  30000,
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, '정산내역');
    writeFile(wb, `정산_${format(new Date(), 'yyyyMM')}.xlsx`);
  }

  const completedTotal = (history.filter((s) => s.status === 'confirmed').reduce((sum, s) => sum + s.total_amount, 0));
  const requestedTotal = (history.filter((s) => s.status === 'requested').reduce((sum, s) => sum + s.total_amount, 0));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">정산 신청</h1>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KPICard label="정산 대기" value={`${pending.length}건`}     sub={formatAmount(pending.length * 30000)} />
          <KPICard label="신청 완료" value={formatAmount(requestedTotal)} sub="확인 대기 중" />
          <KPICard label="확인 완료" value={formatAmount(completedTotal)} sub="누적" />
        </div>

        {/* 정산 대기 목록 */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">정산 대기 ({pending.length}건)</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExcel}>
                  <Download className="w-4 h-4 mr-1" /> 엑셀
                </Button>
                <Button size="sm" onClick={handleRequestSettlement} disabled={requesting || pending.length === 0}
                  className="bg-[#0D2433] hover:bg-[#00A693]">
                  <Send className="w-4 h-4 mr-1" />
                  {requesting ? '신청 중...' : '하나은행 본점에 정산 신청'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-center text-gray-400 py-6">정산 대기 건이 없습니다.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사업장명</TableHead>
                    <TableHead>완료일</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.company_name}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(c.completed_at)}</TableCell>
                      <TableCell className="text-right font-medium">30,000원</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 정산 신청 이력 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">정산 신청 이력</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>정산월</TableHead>
                  <TableHead>건수</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>신청일시</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.year_month}</TableCell>
                    <TableCell>{s.total_count}건</TableCell>
                    <TableCell>{formatAmount(s.total_amount)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(s.requested_at)}</TableCell>
                    <TableCell>
                      <Badge className={s.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {s.status === 'confirmed' ? '확인완료' : '확인대기'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function KPICard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-[#0D2433] mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
