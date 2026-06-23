'use client'
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { CaseTable } from '@/components/cases/CaseTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import type { Case } from '@/types';
import { useRouter } from 'next/navigation';

export default function BranchStatusPage() {
  const supabase = createClient();
  const router   = useRouter();
  const [cases,  setCases]  = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('cases')
      .select('*')
      .order('sent_at', { ascending: false });

    if (search.trim()) {
      query = query.or(`company_name.ilike.%${search}%,biz_reg_no.ilike.%${search}%`);
    }
    const { data } = await query;
    setCases((data as Case[]) ?? []);
    setLoading(false);
  }, [search, supabase]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  // Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel('branch-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchCases)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchCases]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0D2433]">전송 현황</h1>
            <p className="text-sm text-gray-500 mt-1">신청한 퇴직연금 규약의 진행 상황을 확인합니다.</p>
          </div>
          <Button onClick={() => router.push('/branch/apply')} className="bg-[#0D2433] hover:bg-[#00A693]">
            <Plus className="w-4 h-4 mr-1" /> 신규 신청
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="사업장명 또는 사업자번호 검색"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">로딩 중...</div>
        ) : (
          <CaseTable cases={cases} />
        )}
      </main>
    </div>
  );
}
