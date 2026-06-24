'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, Circle, Search, Clock, Home } from 'lucide-react';
import type { Case } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils/formatters';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-ymUxE3zXYmZyS5wPoEXjK8yFjDpuVa67A8AupTyYV0lv18RDU7P1aVV-7KiORoic/exec';

const TRACK_STEPS = [
  { key: 'sent_at',          label: '패스트트랙 신청',       desc: '하나은행 지점 전송' },
  { key: 'assigned_at',      label: '검토 중',               desc: '노무사 배정 완료' },
  { key: 'fax_submitted_at', label: '신청서 접수 · Fax 발송', desc: '관할 노동지청 팩스 발송' },
  { key: 'completed_at',     label: '노동지청 심사',          desc: '패스트트랙 처리 완료' },
] as const;

// 스프레드시트 F열 상태 → 완료된 단계 목록 (Supabase 상태값도 포함)
const STATUS_DONE_KEYS: Record<string, string[]> = {
  '검토대기':            ['sent_at'],
  '신청서 접수/FAX발송':   ['sent_at', 'assigned_at', 'fax_submitted_at'],
  '신청서 접수/FAX 발송':  ['sent_at', 'assigned_at', 'fax_submitted_at'],
  '노동지청 심사':         ['sent_at', 'assigned_at', 'fax_submitted_at', 'completed_at'],
  '팩스제출':              ['sent_at', 'assigned_at', 'fax_submitted_at'],
  '신고완료':              ['sent_at', 'assigned_at', 'fax_submitted_at', 'completed_at'],
};

export default function TrackPage() {
  const supabase = createClient();
  const [bizNo,       setBizNo]       = useState('');
  const [pin,         setPin]         = useState('');
  const [result,      setResult]      = useState<Case | null>(null);
  const [sheetStatus, setSheetStatus] = useState<string>('');
  const [searching,   setSearching]   = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const expectedPin = bizNo.replace(/-/g, '').slice(-4);
    if (pin !== expectedPin) {
      toast.error('비밀번호가 일치하지 않습니다. (사업자번호 뒤 4자리)');
      return;
    }
    setSearching(true);
    setSheetStatus('');
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('biz_reg_no', bizNo)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error('해당 사업자번호로 접수된 건을 찾을 수 없습니다.');
        setResult(null);
        return;
      }
      setResult(data as Case);

      // 스프레드시트에서 실시간 상태 조회
      try {
        const sheetRes  = await fetch(SCRIPT_URL, { cache: 'no-store' });
        const text = await sheetRes.text();
        let sheetJson: { ok: boolean; data?: { biz_reg_no: string; status: string }[] };
        try {
          sheetJson = JSON.parse(text);
        } catch {
          console.warn('[track] 스프레드시트 응답이 JSON이 아님:', text.slice(0, 100));
          return;
        }
        if (sheetJson.ok && Array.isArray(sheetJson.data)) {
          const normalize = (v: string) => v.replace(/-/g, '');
          const row = sheetJson.data.find((r) => normalize(r.biz_reg_no) === normalize(bizNo));
          if (row?.status) {
            console.log('[track] 스프레드시트 상태:', row.status);
            setSheetStatus(row.status);
          }
        }
      } catch (err) {
        console.warn('[track] 스프레드시트 조회 실패:', err);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D2433] flex flex-col">
      {/* 상단 바 */}
      <header className="h-14 flex items-center px-5 gap-3 bg-white/5">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white text-sm font-medium">진행현황 조회</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <p className="text-white font-semibold text-lg">패스트트랙 진행현황 조회</p>
          <p className="text-gray-400 text-sm">퇴직연금 패스트트랙 신청 진행 상황</p>
        </div>

        {/* 검색 폼 */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-1">
                <Label>사업자등록번호</Label>
                <Input
                  placeholder="000-00-00000"
                  value={bizNo}
                  onChange={(e) => setBizNo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>비밀번호</Label>
                <Input
                  type="password"
                  placeholder="사업자등록번호 뒤 4자리"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={searching} className="w-full bg-[#0D2433] hover:bg-[#00A693]">
                <Search className="w-4 h-4 mr-2" />
                {searching ? '조회 중...' : '조회'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 결과 */}
        {result && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{result.company_name}</CardTitle>
              <p className="text-xs text-gray-500">{result.biz_reg_no} · {result.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)'}</p>
              <p className="text-xs text-blue-500">
                [디버그] 시트상태: {sheetStatus || '(없음)'} / DB상태: {result.status || '(없음)'}
              </p>
            </CardHeader>
            <CardContent>
              {/* 4단계 트래커 */}
              <div className="space-y-4">
                {TRACK_STEPS.map(({ key, label, desc }, idx) => {
                  const doneKeys = STATUS_DONE_KEYS[sheetStatus] ?? STATUS_DONE_KEYS[result.status ?? '검토대기'] ?? ['sent_at'];
                  const dateVal  = result[key as keyof Case] as string | undefined;
                  const isDone   = doneKeys.includes(key) || !!dateVal;
                  const isNext   = !isDone && idx === TRACK_STEPS.findIndex((s) => !doneKeys.includes(s.key) && !result[s.key as keyof Case]);

                  return (
                    <div key={key} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : isNext ? (
                          <Clock className="w-5 h-5 text-teal-500 animate-pulse" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDone ? 'text-green-700' : isNext ? 'text-teal-700' : 'text-gray-400'}`}>
                          {label}
                        </p>
                        <p className="text-xs text-gray-400">{desc}</p>
                        {isDone && (
                          <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(dateVal)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.status === '반려' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-700">반려 처리</p>
                  <p className="text-xs text-red-600 mt-1">{result.rejection_reason}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between">
                <span>신청일: {formatDate(result.sent_at)}</span>
                <span>지점: {result.hana_branch}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}
