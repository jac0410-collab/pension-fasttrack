export const dynamic = 'force-dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { ApplyForm } from '@/components/forms/ApplyForm';

export default async function BranchApplyPage() {
  let role: string | undefined;
  let email: string | undefined;
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    role  = user?.user_metadata?.role;
    email = user?.email ?? undefined;
  } catch { /* Supabase 미설정 시 무시 */ }

  return (
    <div className="min-h-screen">
      <Navbar role={role} email={email} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D2433]">퇴직연금 규약 신청</h1>
          <p className="text-sm text-gray-500 mt-1">패스트트랙 서비스 — 사업장 정보를 입력해주세요.</p>
        </div>
        <ApplyForm />
      </main>
    </div>
  );
}
