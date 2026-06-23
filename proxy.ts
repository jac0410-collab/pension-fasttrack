import { NextResponse, type NextRequest } from 'next/server';

// 로그인/인증 없이 전체 공개 접근
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
