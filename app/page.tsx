import Link from 'next/link';
import { FileText, Send, Search, Settings } from 'lucide-react';

const MENU = [
  {
    href:  '/assist',
    icon:  FileText,
    title: '퇴직연금 규약 및 신고서 작성 도우미',
    desc:  '사업장 정보를 입력하면 규약 전문과 신고서를\n자동으로 작성·PDF로 생성해 드립니다.',
    color: 'from-[#0D2433] to-[#1a3a52]',
    badge: '작성 도우미',
  },
  {
    href:  '/apply',
    icon:  Send,
    title: '퇴직연금 패스트트랙 신청',
    desc:  '한국공인노무사회 당직 노무사가 서류를 검토하고\n관할 노동지청에 팩스로 제출합니다.',
    color: 'from-[#00A693] to-[#007a6b]',
    badge: '패스트트랙',
  },
  {
    href:  '/track',
    icon:  Search,
    title: '패스트트랙 진행 현황',
    desc:  '사업자등록번호를 입력하여\n신청 진행 상황을 실시간으로 확인합니다.',
    color: 'from-[#4a5568] to-[#2d3748]',
    badge: '현황 조회',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0D2433] flex flex-col">
      {/* 우측 상단 관리자 버튼 */}
      <div className="absolute top-4 right-4">
        <Link href="/admin" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors">
          <Settings className="w-3.5 h-3.5" />
          관리자 페이지
        </Link>
      </div>

      {/* 헤더 */}
      <header className="pt-12 pb-8 text-center px-4">
        <div className="inline-flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-3 mb-6">
          <div className="w-8 h-8 bg-[#00A693] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="text-white font-semibold text-sm">퇴직연금 패스트트랙</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          퇴직연금 규약 패스트트랙
        </h1>
        <p className="text-[#00A693] mt-2 text-sm font-medium">
          한국공인노무사회 × 하나은행
        </p>
        <p className="text-gray-400 mt-3 text-sm max-w-md mx-auto">
          「근로감독관 집무규정」 제77조 제2항 기반 — 노무사 확인 후 즉시 수리
        </p>
      </header>

      {/* 메뉴 카드 */}
      <main className="flex-1 flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-3xl grid gap-4 md:grid-cols-1">
          {MENU.map(({ href, icon: Icon, title, desc, color, badge }) => (
            <Link key={href} href={href} className="group block">
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 md:p-8 transition-transform duration-200 group-hover:scale-[1.02] group-hover:shadow-2xl`}>
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full mb-2">
                      {badge}
                    </span>
                    <h2 className="text-white font-bold text-xl leading-snug">{title}</h2>
                    <p className="text-white/70 text-sm mt-2 leading-relaxed whitespace-pre-line">
                      {desc}
                    </p>
                  </div>
                  <div className="text-white/40 group-hover:text-white/80 transition-colors text-2xl self-center">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="text-center text-gray-600 text-xs pb-8">
        © 한국공인노무사회 · 하나은행 MOU 서비스
      </footer>
    </div>
  );
}

