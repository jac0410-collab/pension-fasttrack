import { NextResponse } from 'next/server';

const SHEETS_URL =
  process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbw-ymUxE3zXYmZyS5wPoEXjK8yFjDpuVa67A8AupTyYV0lv18RDU7P1aVV-7KiORoic/exec';

export interface SheetRow {
  id:           string;
  company_name: string;
  biz_reg_no:   string;
  ceo_name:     string;
  ceo_phone:    string;
  status:       string;
  sent_at:      string;
}

export async function GET() {
  try {
    const res  = await fetch(SHEETS_URL, { cache: 'no-store' });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
