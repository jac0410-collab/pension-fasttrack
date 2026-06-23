'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Shield, UserCheck, Landmark } from 'lucide-react';

const ROLE_OPTIONS = [
  { id: 'hana_branch', label: '하나은행 지점',   icon: Building2, color: 'border-blue-500 bg-blue-50'  },
  { id: 'kcaa_admin',  label: '노무사회 실무자', icon: Shield,     color: 'border-teal-500 bg-teal-50'  },
  { id: 'kcaa_duty',   label: '당직 노무사',     icon: UserCheck,  color: 'border-amber-500 bg-amber-50' },
  { id: 'hana_hq',     label: '하나은행 본점',   icon: Landmark,   color: 'border-purple-500 bg-purple-50'},
] as const;

const ROLE_REDIRECTS: Record<string, string> = {
  hana_branch: '/branch/apply',
  kcaa_admin:  '/admin/inbox',
  kcaa_duty:   '/duty/today',
  hana_hq:     '/hq/dashboard',
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const role = data.user?.user_metadata?.role as string;
      router.push(ROLE_REDIRECTS[role] ?? '/');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D2433] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 로고 영역 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-2xl px-6 py-3">
            <div className="w-8 h-8 bg-[#00A693] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-white font-semibold">퇴직연금 패스트트랙</span>
          </div>
          <p className="text-gray-400 text-sm">한국공인노무사회 × 하나은행</p>
        </div>

        {/* 역할 안내 */}
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map(({ id, label, icon: Icon, color }) => (
            <div key={id} className={`border rounded-lg p-3 ${color} flex items-center gap-2`}>
              <Icon className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* 로그인 폼 */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-center text-[#0D2433]">로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0D2433] hover:bg-[#00A693] transition-colors"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              계정 문의: 한국공인노무사회 사무국
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
