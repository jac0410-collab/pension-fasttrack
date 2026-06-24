'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Lock, FileText, Clock, CheckCircle, TrendingUp, Building2, RefreshCw } from 'lucide-react';
import type { SheetRow } from '@/app/api/sheet-data/route';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-ymUxE3zXYmZyS5wPoEXjK8yFjDpuVa67A8AupTyYV0lv18RDU7P1aVV-7KiORoic/exec';

const ADMIN_PASSWORD = '6293';
const PRICE_PER_CASE = 30000;

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

function formatDate(val: string) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getYearMonth(val: string) {
  if (!val) return '미상';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val.slice(0, 7);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    '검토대기':          'bg-blue-100 text-blue-700',
    '신청서 접수/FAX발송': 'bg-purple-100 text-purple-700',
    '노동지청 심사':      'bg-green-100 text-green-700',
    '반려':              'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

// ── 비밀번호 화면 ──────────────────────────────────────────
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw]       = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setPw('');
    }
  }

  return (
    <div className="min-h-screen bg-[#0D2433] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#0D2433] rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#0D2433]">관리자 페이지</h1>
          <p className="text-sm text-gray-400 mt-1">비밀번호를 입력해주세요</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false); }}
            placeholder="비밀번호 4자리"
            maxLength={4}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-[#00A693]"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 text-center">비밀번호가 올바르지 않습니다.</p>}
          <button
            type="submit"
            className="w-full bg-[#0D2433] text-white rounded-xl py-3 font-semibold hover:bg-[#00A693] transition-colors"
          >
            입장
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← 홈으로</Link>
        </div>
      </div>
    </div>
  );
}

// ── 메인 관리자 페이지 ─────────────────────────────────────
export default function AdminPage() {
  const [auth, setAuth]     = useState(false);
  const [rows, setRows]     = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(SCRIPT_URL, { cache: 'no-store' });
      const text = await res.text();
      let json: { ok: boolean; data?: SheetRow[]; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        console.error('[admin] Apps Script 응답 (JSON 아님):', text.slice(0, 200));
        setError('Apps Script가 JSON을 반환하지 않았습니다. 배포 설정을 확인하세요.');
        return;
      }
      if (json.ok) {
        setRows(json.data ?? []);
      } else {
        setError(json.error ?? '데이터 로드 실패');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auth) loadData();
  }, [auth]);

  if (!auth) return <PasswordGate onSuccess={() => setAuth(true)} />;

  // ── 대시보드 통계
  const total   = rows.length;
  const pending = rows.filter((r) => r.status === '검토대기').length;
  const done    = rows.filter((r) => r.status === '노동지청 심사' || r.status === '신고완료').length;

  // ── 월별 정산
  const monthMap: Record<string, number> = {};
  rows.forEach((r) => {
    const ym = getYearMonth(r.sent_at);
    monthMap[ym] = (monthMap[ym] ?? 0) + 1;
  });
  const settlements = Object.entries(monthMap).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-[#0D2433] h-14 flex items-center px-5 gap-3">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white text-sm font-medium">마스터 관리자 페이지</span>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span>구글 스프레드시트 연동</span>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1 text-white/60 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0D2433]">마스터 관리자 페이지</h1>
          <span className="text-xs text-gray-400">※ 구글 스프레드시트 데이터 기준</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
            <p className="font-semibold">데이터 로드 오류</p>
            <p>{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Apps Script 배포 설정에서 액세스 권한을 <strong>「모든 사용자(익명 포함)」</strong>으로 변경 후 새 버전 배포가 필요합니다.
            </p>
          </div>
        )}

        {/* ── 총괄 대시보드 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">총괄 대시보드</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: FileText, label: '전체 접수 건수', value: total,   color: 'bg-blue-50',   iconColor: 'text-blue-600',  textColor: 'text-[#0D2433]' },
              { icon: Clock,    label: '검토 대기 건수', value: pending, color: 'bg-amber-50',  iconColor: 'text-amber-500', textColor: 'text-amber-500' },
              { icon: CheckCircle, label: '완료 건수',  value: done,    color: 'bg-green-50',  iconColor: 'text-green-500', textColor: 'text-green-600' },
            ].map(({ icon: Icon, label, value, color, iconColor, textColor }) => (
              <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <span className="text-sm text-gray-500">{label}</span>
                </div>
                <p className={`text-3xl font-bold ${textColor}`}>
                  {loading ? <span className="text-gray-300">-</span> : value}
                  <span className="text-base font-normal text-gray-400 ml-1">건</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── 사업장 접수 리스트 */}
          <section className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 사업장 접수 리스트
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">접수된 건이 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['접수번호', '사업장명', '대표자', '연락처', '신청일', '상태'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.id}</td>
                          <td className="px-4 py-3 font-medium text-[#0D2433]">{r.company_name}</td>
                          <td className="px-4 py-3 text-gray-600">{r.ceo_name}</td>
                          <td className="px-4 py-3 text-gray-500">{r.ceo_phone || '-'}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(r.sent_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>
                              {r.status || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ── 정산 관리 */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 정산 관리
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {settlements.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">데이터 없음</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">월</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">건수</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">정산 예상금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {settlements.map(([month, count]) => (
                      <tr key={month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">{month}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{count}건</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#0D2433]">
                          {formatKRW(count * PRICE_PER_CASE)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#0D2433]/5 font-bold">
                      <td className="px-4 py-3 text-[#0D2433]">합계</td>
                      <td className="px-4 py-3 text-right text-[#0D2433]">{total}건</td>
                      <td className="px-4 py-3 text-right text-[#00A693]">{formatKRW(total * PRICE_PER_CASE)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">건당 단가 {formatKRW(PRICE_PER_CASE)} 기준</p>
          </section>
        </div>
      </main>
    </div>
  );
}
