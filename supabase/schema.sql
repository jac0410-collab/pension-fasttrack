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
  hana_branch         text not null,
  hana_manager        text not null,
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

-- cases RLS
create policy "hana_branch: 본인 건 read"
  on cases for select
  using (
    get_user_role() = 'hana_branch'
    and created_by = auth.uid()
  );

create policy "hana_branch: insert"
  on cases for insert
  with check (get_user_role() = 'hana_branch');

create policy "kcaa_admin: 전체 read/write"
  on cases for all
  using (get_user_role() = 'kcaa_admin');

create policy "kcaa_duty: 배정 건 read/write"
  on cases for all
  using (
    get_user_role() = 'kcaa_duty'
    and assigned_lawyer_id = auth.uid()
  );

create policy "hana_hq: 전체 read"
  on cases for select
  using (get_user_role() = 'hana_hq');

-- public track: 사업자번호로 단건 조회 허용
create policy "public: track 조회"
  on cases for select
  using (true);

-- lawyers RLS
create policy "kcaa_admin: lawyers 전체"
  on lawyers for all
  using (get_user_role() = 'kcaa_admin');

create policy "kcaa_duty: lawyers read"
  on lawyers for select
  using (get_user_role() = 'kcaa_duty');

-- settlements RLS
create policy "kcaa_admin: settlements 전체"
  on settlements for all
  using (get_user_role() = 'kcaa_admin');

create policy "hana_hq: settlements read/update"
  on settlements for all
  using (get_user_role() = 'hana_hq');

-- =============================================
-- Storage 버킷 생성 (Supabase 대시보드에서 수동 생성 권장)
-- =============================================
-- 버킷명: documents
-- Public: false
-- 폴더 구조: {case_id}/report.pdf, regulation.pdf, confirmation.pdf, consent.pdf, biz_reg.pdf

-- =============================================
-- 샘플 노무사 데이터
-- =============================================
insert into lawyers (name, reg_no, region, phone) values
  ('김노무', 'KR-2024-001', '서울', '010-1234-5678'),
  ('이노무', 'KR-2024-002', '경기', '010-2345-6789'),
  ('박노무', 'KR-2024-003', '부산', '010-3456-7890')
on conflict do nothing;
