'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge';
import { AlertTriangle, Clock, FileText } from 'lucide-react';
import type { Case } from '@/types';
import { formatDateTime } from '@/lib/utils/formatters';

export default function DutyTodayPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [cases,  setCases]  = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId] = useState<string | null>(null);

  const fetchCases = useCallback(async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('cases')
      .select('*')
      .eq('assigned_lawyer_id', uid)
      .neq('status', '신고완료')
      .neq('status', '반려')
      .order('delay_flag', { ascending: false })
      .order('sent_at');
    setCases((data as Case[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        fetchCases(data.user.id);
      }
    });
  }, [supabase, fetchCases]);

  const hasDoc = (c: Case, key: keyof Case) => !!c[key];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">오늘 업무 목록</h1>
          <p className="text-sm text-gray-500 mt-1">배정된 검토 건 ({cases.length}건)</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">로딩 중...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>배정된 건이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cases.map((c) => (
              <Card
                key={c.id}
                onClick={() => router.push(`/duty/cases/${c.id}`)}
                className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  c.delay_flag ? 'border-l-red-500' : 'border-l-[#00A693]'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {c.delay_flag && (
                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> 지연
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        c.pension_type === 'DB' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>{c.pension_type}</span>
                    </div>
                    <CaseStatusBadge status={c.status} />
                  </div>
                  <h3 className="font-bold text-[#0D2433] text-base">{c.company_name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{c.biz_reg_no}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.hana_branch} · {c.hana_manager}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                    <Clock className="w-3 h-3" /> {formatDateTime(c.sent_at)}
                  </div>
                  {/* 서류 미리보기 배지 */}
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {([
                      { key: 'doc_report_path',     label: '신고서' },
                      { key: 'doc_regulation_path', label: '규약' },
                      { key: 'doc_consent_path',    label: '동의서' },
                      { key: 'doc_biz_reg_path',    label: '사업자등록증' },
                    ] as const).map(({ key, label }) => (
                      <span key={key} className={`text-xs px-1.5 py-0.5 rounded-full ${
                        hasDoc(c, key) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {hasDoc(c, key) ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
