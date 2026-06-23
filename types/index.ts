export type UserRole = 'hana_branch' | 'kcaa_admin' | 'kcaa_duty' | 'hana_hq';

export type CaseStatus =
  | '검토대기'
  | '노무사배정'
  | '검토중'
  | '팩스제출'
  | '신고완료'
  | '반려';

export type PensionType = 'DB' | 'DC';
export type BusinessType = 'corporation' | 'individual';
export type WorkerRepType = 'majority' | 'union';
export type EnrollmentTiming = 'immediate' | 'after1year';
export type CoveragePeriod = 'afterSetup' | 'includesPast' | 'specificDate';
export type PaymentCycle = 'annual' | 'semiannual' | 'quarterly' | 'monthly';

export interface Case {
  id: string;
  company_name: string;
  biz_reg_no: string;
  ceo_name: string;
  ceo_phone?: string;
  address: string;
  employee_count: number;
  fiscal_month: number;
  business_type: BusinessType;
  industry?: string;
  phone?: string;
  fax_number?: string;
  pension_type: PensionType;
  start_date: string;
  providers: string[];
  lead_institution?: string;
  worker_rep_type: WorkerRepType;
  enrollment_timing: EnrollmentTiming;
  include_executives: boolean;
  coverage_period: CoveragePeriod;
  coverage_date?: string;
  payment_cycle?: PaymentCycle;
  opinion_date?: string;
  labor_office?: string;
  signature_data?: string;
  doc_consent_path?: string;
  doc_biz_reg_path?: string;
  doc_report_path?: string;
  doc_regulation_path?: string;
  doc_confirm_path?: string;
  status: CaseStatus;
  assigned_lawyer_id?: string;
  worker_rep_consent: boolean;
  rejection_reason?: string;
  delay_flag: boolean;
  settled: boolean;
  note?: string;
  hana_branch: string;
  hana_manager: string;
  created_by?: string;
  sent_at: string;
  assigned_at?: string;
  review_started_at?: string;
  fax_submitted_at?: string;
  completed_at?: string;
}

export interface Lawyer {
  id: string;
  name: string;
  reg_no: string;
  region: string;
  phone: string;
  is_active: boolean;
  monthly_count: number;
  created_at: string;
}

export interface Settlement {
  id: string;
  year_month: string;
  case_ids: string[];
  total_count: number;
  total_amount: number;
  status: 'requested' | 'confirmed';
  requested_at: string;
  confirmed_at?: string;
}

export type CaseFormData = Omit<
  Case,
  | 'id'
  | 'status'
  | 'assigned_lawyer_id'
  | 'rejection_reason'
  | 'delay_flag'
  | 'settled'
  | 'created_by'
  | 'sent_at'
  | 'assigned_at'
  | 'review_started_at'
  | 'fax_submitted_at'
  | 'completed_at'
  | 'doc_report_path'
  | 'doc_regulation_path'
  | 'doc_confirm_path'
>;

export const PROVIDERS_LIST = [
  '하나은행','국민은행','신한은행','우리은행','기업은행','농협은행',
  '삼성생명보험','교보생명보험','미래에셋생명보험','삼성화재',
  '미래에셋증권','한화생명','하나증권','NH투자증권','한국투자증권',
  '현대차증권','DB생명보험',
] as const;

export const STATUS_COLORS: Record<CaseStatus, string> = {
  '검토대기':   'bg-blue-100 text-blue-800',
  '노무사배정': 'bg-amber-100 text-amber-800',
  '검토중':     'bg-teal-100 text-teal-800',
  '팩스제출':   'bg-purple-100 text-purple-800',
  '신고완료':   'bg-green-100 text-green-800',
  '반려':       'bg-red-100 text-red-800',
};

export const STATUS_FLOW: CaseStatus[] = [
  '검토대기', '노무사배정', '검토중', '팩스제출', '신고완료',
];
