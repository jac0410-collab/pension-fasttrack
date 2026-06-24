import { NextRequest, NextResponse } from 'next/server';

const SHEETS_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

export async function POST(req: NextRequest) {
  if (!SHEETS_URL) {
    console.error('[notify-sheets] GOOGLE_SHEETS_WEBHOOK_URL 환경변수 없음');
    return NextResponse.json({ error: 'webhook url not configured' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  try {
    const res = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log('[notify-sheets] Apps Script 응답:', res.status, text);

    if (!res.ok) {
      return NextResponse.json({ error: 'apps script error', detail: text }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notify-sheets] fetch 오류:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
