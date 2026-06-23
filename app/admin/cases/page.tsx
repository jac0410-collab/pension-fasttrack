'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { CaseTable } from '@/components/cases/CaseTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Case, CaseStatus } from '@/types';

const TABS: { label: string; value: CaseStatus | 'all' }[] = [
  { label: '전체',       value: 'all'      },
  { label: '검토대기',   value: '검토대기' },
  { label: '노무사배정', value: '노무사배정'},
  { label: '검토중',     value: '검토중'   },
  { label: '팩스제출',   value: '팩스제출' },
  { label: '신고완료',   value: '신고완료' },
  { label: '반려',       value: '반려'     },
];

export default function AdminCasesPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [cases,  setCases]  = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [tab,    setTab]    = useState<CaseStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('cases').select('*').order('sent_at', { ascending: false });
    if (tab !== 'all') query = query.eq('status', tab);
    if (search.trim()) {
      query = query.or(`company_name.ilike.%${search}%,biz_reg_no.ilike.%${search}%`);
    }
    const { data } = await query;
    setCases((data as Case[]) ?? []);
    setLoading(false);
  }, [supabase, tab, search]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">전체 건 목록</h1>
          <p className="text-sm text-gray-500 mt-1">모든 퇴직연금 신청 건을 관리합니다.</p>
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

        <Tabs value={tab} onValueChange={(v) => setTab(v as CaseStatus | 'all')}>
          <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1">
            {TABS.map(({ label, value }) => (
              <TabsTrigger key={value} value={value} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">로딩 중...</div>
            ) : (
              <CaseTable
                cases={cases}
                showLawyer
                onRowClick={(c) => router.push(`/admin/cases/${c.id}`)}
              />
            )}
          </div>
        </Tabs>
      </main>
    </div>
  );
}
