import { createClient } from '@/lib/supabase/client';

// 추후 실제 하나은행 API로 교체. 이 파일의 함수들만 수정하면 됨.
export async function sendCaseToKCAA(caseId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('cases')
    .update({ status: '검토대기', sent_at: new Date().toISOString() })
    .eq('id', caseId);
  if (error) throw error;
}
