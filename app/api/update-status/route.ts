import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const WEBHOOK_SECRET = 'pension-fasttrack-2026';

// 스프레드시트 F열 값 → Supabase 업데이트 필드 매핑
function getUpdates(sheetStatus: string): Record<string, string> | null {
  const now = new Date().toISOString();
  if (sheetStatus === '신청서 접수/FAX발송' || sheetStatus === '신청서 접수/FAX 발송') {
    return { fax_submitted_at: now, status: '팩스제출' };
  }
  if (sheetStatus === '노동지청 심사') {
    return { completed_at: now, status: '신고완료' };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { caseId: string; sheetStatus: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { caseId, sheetStatus } = body;
  if (!caseId || !sheetStatus) {
    return NextResponse.json({ error: 'caseId and sheetStatus required' }, { status: 400 });
  }

  const updates = getUpdates(sheetStatus);
  if (!updates) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', caseId);

  if (error) {
    console.error('[update-status] Supabase 오류:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[update-status] ${caseId} → ${sheetStatus} 업데이트 완료`);
  return NextResponse.json({ ok: true });
}
