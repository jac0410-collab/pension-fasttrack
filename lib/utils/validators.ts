import { z } from 'zod';

export const bizRegNoSchema = z
  .string()
  .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자등록번호 형식이 올바르지 않습니다 (000-00-00000)');

export function validateBizRegNo(value: string): boolean {
  return /^\d{3}-\d{2}-\d{5}$/.test(value);
}

export const caseFormSchema = z.object({
  company_name:      z.string().min(1, '사업장명을 입력해주세요'),
  biz_reg_no:        bizRegNoSchema,
  ceo_name:          z.string().min(1, '대표자 성명을 입력해주세요'),
  ceo_phone:         z.string().optional(),
  address:           z.string().min(1, '주소를 입력해주세요'),
  employee_count:    z.number().min(1, '근로자 수를 입력해주세요'),
  fiscal_month:      z.number().min(1).max(12),
  business_type:     z.enum(['corporation', 'individual']),
  industry:          z.string().optional(),
  phone:             z.string().optional(),
  fax_number:        z.string().optional(),
  pension_type:      z.enum(['DB', 'DC']),
  start_date:        z.string().min(1, '제도시행일을 입력해주세요'),
  providers:         z.array(z.string()).min(1, '퇴직연금사업자를 선택해주세요'),
  lead_institution:  z.string().optional(),
  worker_rep_type:   z.enum(['majority', 'union']),
  enrollment_timing: z.enum(['immediate', 'after1year']),
  include_executives:z.boolean(),
  coverage_period:   z.enum(['afterSetup', 'includesPast', 'specificDate']),
  coverage_date:     z.string().optional(),
  payment_cycle:     z.enum(['annual', 'semiannual', 'quarterly', 'monthly']).optional(),
  opinion_date:      z.string().optional(),
  labor_office:      z.string().optional(),
  signature_data:    z.string().optional(),
  doc_consent_path:  z.string().optional(),
  doc_biz_reg_path:  z.string().optional(),
  hana_branch:       z.string().optional(),
  hana_manager:      z.string().optional(),
  worker_rep_consent:z.boolean(),
  note:              z.string().optional(),
});

export type CaseFormValues = z.infer<typeof caseFormSchema>;
