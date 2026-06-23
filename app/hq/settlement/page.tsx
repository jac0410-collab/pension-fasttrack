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
import { CheckCircle } from 'lucide-react';
import type { Settlement } from '@/types';
import { formatDateTime, formatAmount } from '@/lib/utils/formatters';

export default function HQSettlementPage() {
  const supabase  = createClient();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [confirming,  setConfirming]  = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('settlements').select('*').order('requested_at', { ascending: false });
    setSettlements((data as Settlement[]) ?? []);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleConfirm(id: string) {
    setConfirming(id);
    try {
      const { error } = await supabase.from('settlements').update({
        status:       'confirmed',
        confirmed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      toast.success('정산 확인 완료');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConfirming(null);
    }
  }

  const totalAmount    = settlements.reduce((s, x) => s + x.total_amount, 0);
  const confirmedAmt   = settlements.filter((s) => s.status === 'confirmed').reduce((s, x) => s + x.total_amount, 0);
  const requestedCount = settlements.filter((s) => s.status === 'requested').length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">정산 확인</h1>
          <p className="text-sm text-gray-500 mt-1">노무사회에서 신청한 정산을 확인합니다.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <KPICard label="총 정산 금액"   value={formatAmount(totalAmount)} />
          <KPICard label="확인 대기 건수"  value={`${requestedCount}건`}     sub="승인 필요" />
          <KPICard label="확인 완료 금액"  value={formatAmount(confirmedAmt)} />
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">정산 목록</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>정산월</TableHead>
                  <TableHead>건수</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>신청일시</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>처리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.year_month}</TableCell>
                    <TableCell>{s.total_count}건</TableCell>
                    <TableCell className="font-medium">{formatAmount(s.total_amount)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(s.requested_at)}</TableCell>
                    <TableCell>
                      <Badge className={s.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {s.status === 'confirmed' ? '확인완료' : '확인대기'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === 'requested' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(s.id)}
                          disabled={confirming === s.id}
                          className="bg-[#0D2433] hover:bg-[#00A693]"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          {confirming === s.id ? '처리 중...' : '확인'}
                        </Button>
                      )}
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

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-[#0D2433] mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
