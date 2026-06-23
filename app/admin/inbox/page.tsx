'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { Case, Lawyer } from '@/types';
import { formatDateTime } from '@/lib/utils/formatters';

export default function AdminInboxPage() {
  const supabase = createClient();
  const [cases,   setCases]   = useState<Case[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selected, setSelected] = useState<Record<string, string | undefined>>({});
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('cases').select('*').eq('status', '검토대기').order('sent_at'),
      supabase.from('lawyers').select('*').eq('is_active', true).order('name'),
    ]);
    setCases((c as Case[]) ?? []);
    setLawyers((l as Lawyer[]) ?? []);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAssign(caseId: string) {
    const lawyerId = selected[caseId] as string | undefined;
    if (!lawyerId) { toast.warning('담당 노무사를 선택해주세요.'); return; }
    setAssigning(caseId);
    try {
      const { error } = await supabase.from('cases').update({
        assigned_lawyer_id: lawyerId,
        status:             '노무사배정',
        assigned_at:        new Date().toISOString(),
      }).eq('id', caseId);
      if (error) throw error;
      toast.success('노무사 배정 완료');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(null);
    }
  }

  const hasDoc = (c: Case, key: keyof Case) => !!c[key];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">수신함</h1>
          <p className="text-sm text-gray-500 mt-1">노무사 배정 대기 중인 건 ({cases.length}건)</p>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
            <p>배정 대기 중인 건이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => {
              const isDelayed = c.delay_flag;
              return (
                <Card key={c.id} className={`border-l-4 ${isDelayed ? 'border-l-red-500' : 'border-l-[#00A693]'}`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isDelayed && (
                            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> 지연
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            c.pension_type === 'DB' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>{c.pension_type}</span>
                          <CaseStatusBadge status={c.status} />
                        </div>
                        <h3 className="font-bold text-[#0D2433] text-lg">{c.company_name}</h3>
                        <p className="text-sm text-gray-500">{c.biz_reg_no} · {c.hana_branch} · {c.hana_manager}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" /> {formatDateTime(c.sent_at)}
                        </div>
                        {/* 서류 상태 */}
                        <div className="flex gap-2 mt-1">
                          {([
                            { key: 'doc_report_path',      label: '신고서' },
                            { key: 'doc_regulation_path',  label: '규약' },
                            { key: 'doc_consent_path',     label: '동의서' },
                            { key: 'doc_biz_reg_path',     label: '사업자등록증' },
                          ] as const).map(({ key, label }) => (
                            <span key={key} className={`text-xs px-2 py-0.5 rounded-full ${
                              hasDoc(c, key) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {hasDoc(c, key) ? '✓' : '○'} {label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:min-w-[280px]">
                        <Select
                          value={selected[c.id] ?? ''}
                          onValueChange={(v: string | null) => setSelected((p) => ({ ...p, [c.id]: v ?? undefined }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="노무사 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {lawyers.map((l) => (
                              <SelectItem key={l.id} value={l.id}>
                                {l.name} ({l.region}) — 이번달 {l.monthly_count}건
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => handleAssign(c.id)}
                          disabled={assigning === c.id}
                          className="bg-[#0D2433] hover:bg-[#00A693] shrink-0"
                        >
                          {assigning === c.id ? '배정 중...' : '배정'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
