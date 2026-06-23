'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  hana_branch: '하나은행 지점',
  kcaa_admin:  '노무사회 실무자',
  kcaa_duty:   '당직 노무사',
  hana_hq:     '하나은행 본점',
};

interface Props {
  role?: string;
  email?: string;
}

export function Navbar({ role, email }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-14 bg-[#0D2433] flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-[#00A693] flex items-center justify-center">
          <span className="text-white text-xs font-bold">H</span>
        </div>
        <span className="text-white font-semibold text-sm">퇴직연금 패스트트랙</span>
        {role && (
          <span className="bg-[#00A693]/20 text-[#00A693] text-xs px-2 py-0.5 rounded-full border border-[#00A693]/30">
            {ROLE_LABELS[role] ?? role}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {email && <span className="text-gray-400 text-xs">{email}</span>}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-300 hover:text-white hover:bg-white/10">
          <LogOut className="w-4 h-4 mr-1" /> 로그아웃
        </Button>
      </div>
    </header>
  );
}
