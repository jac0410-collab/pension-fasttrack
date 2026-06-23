-- =============================================
-- 퇴직연금 패스트트랙 — Supabase 스키마
-- Supabase SQL Editor에서 실행
-- =============================================

-- 노무사 테이블
create table if not exists lawyers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  reg_no        text not null,
  region        text not null,
  phone         text not null,
  is_active     boolean not null default true,
  monthly_count integer not null default 0,
  created_at    timestamptz default now()
);

-- 케이스 테이블
create table if not exists cases (
  id                  text primary key,
  company_name        text not null,
  biz_reg_no          text not null,
  ceo_name            text not null,
  ceo_phone           text,
  address             text not null,
  employee_count      integer not null,
  fiscal_month        integer not null,
  business_type       text not null,
  industry            text,
  phone               text,
  fax_number          text,
  pension_type        text not null,
  start_date          date not null,
  providers           jsonb not null default '[]',
  lead_institution    text,
  worker_rep_type     text not null,
  enrollment_timing   text not null,
  include_executives  boolean not null default false,
  coverage_period     text not null,
  coverage_date       date,
  payment_cycle       text,
  opinion_date        date,
  labor_office        text,
  signature_data      text,
  doc_consent_path    text,
  doc_biz_reg_path    text,
  doc_report_path     text,
  doc_regulation_path text,
  doc_confirm_path    text,
  status              text not null default '검토대기',
  assigned_lawyer_id  uuid references lawyers(id),
  worker_rep_consent  boolean not null default false,
  rejection_reason    text,
  delay_flag          boolean not null default false,
  settled             boolean not null default false,
  note                text,
  hana_branch         text not null default '-',
  hana_manager        text not null default '-',
  created_by          uuid references auth.users(id),
  sent_at             timestamptz not null default now(),
  assigned_at         timestamptz,
  review_started_at   timestamptz,
  fax_submitted_at    timestamptz,
  completed_at        timestamptz
);

-- 정산 테이블
create table if not exists settlements (
  id            uuid primary key default gen_random_uuid(),
  year_month    text not null,
  case_ids      jsonb not null default '[]',
  total_count   integer not null,
  total_amount  integer not null,
  status        text not null default 'requested',
  requested_at  timestamptz default now(),
  confirmed_at  timestamptz
);

-- =============================================
-- RLS 설정
-- =============================================

alter table cases       enable row level security;
alter table lawyers     enable row level security;
alter table settlements enable row level security;

-- 역할 helper 함수
create or replace function get_user_role()
returns text as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    ''
  );
$$ language sql security definer;

-- cases RLS: 비로그인 사용자도 신청·조회 가능
create policy "public: 신청 insert"
  on cases for insert
  to anon, authenticated
  with check (true);

create policy "public: 진행현황 조회"
  on cases for select
  to anon, authenticated
  using (true);

create policy "public: 케이스 update (관리자용)"
  on cases for update
  to authenticated
  using (true);

-- lawyers RLS
create policy "lawyers: authenticated read"
  on lawyers for select
  to authenticated
  using (true);

-- settlements RLS
create policy "settlements: authenticated all"
  on settlements for all
  to authenticated
  using (true);

-- =============================================
-- Storage 정책 (documents 버킷)
-- =============================================

-- anon 사용자도 파일 업로드 가능
create policy "public: documents upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'documents1');

-- anon 사용자도 파일 조회 가능
create policy "public: documents read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'documents1');

-- =============================================
-- 샘플 노무사 데이터
-- =============================================
insert into lawyers (name, reg_no, region, phone) values
  ('김노무', 'KR-2024-001', '서울', '010-1234-5678'),
  ('이노무', 'KR-2024-002', '경기', '010-2345-6789'),
  ('박노무', 'KR-2024-003', '부산', '010-3456-7890')
on conflict do nothing;
