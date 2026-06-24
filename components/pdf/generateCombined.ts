'use client';
import type { Case } from '@/types';
import { buildReportHTML } from './generateReport';
import { buildRegulationHTML } from './generateRegulation';
import { generateRegulation } from '@/lib/regulation/generator';
import { renderMultipleHtmlToPdf } from './renderHtmlToPdf';

/**
 * 신고서(1페이지) + 규약(DB→2번시트 / DC→3번시트 기준) 을 하나의 PDF로 생성
 * pension_type이 'DB'면 확정급여형, 'DC'면 확정기여형 규약이 이어붙음
 */
export async function generateCombinedPDF(data: Case): Promise<Blob> {
  const regulationText = generateRegulation({
    company_name:       data.company_name,
    biz_reg_no:         data.biz_reg_no,
    ceo_name:           data.ceo_name,
    ceo_phone:          data.ceo_phone,
    address:            data.address,
    employee_count:     data.employee_count,
    fiscal_month:       data.fiscal_month,
    business_type:      data.business_type,
    industry:           data.industry,
    phone:              data.phone,
    fax_number:         data.fax_number,
    pension_type:       data.pension_type,
    start_date:         data.start_date,
    providers:          data.providers,
    lead_institution:   data.lead_institution,
    worker_rep_type:    data.worker_rep_type,
    enrollment_timing:  data.enrollment_timing,
    include_executives: data.include_executives,
    coverage_period:    data.coverage_period,
    coverage_date:      data.coverage_date,
    payment_cycle:      data.payment_cycle,
    opinion_date:       data.opinion_date,
    labor_office:       data.labor_office,
    signature_data:     data.signature_data,
    doc_consent_path:   data.doc_consent_path,
    doc_biz_reg_path:   data.doc_biz_reg_path,
    hana_branch:        data.hana_branch,
    hana_manager:       data.hana_manager,
    worker_rep_consent: data.worker_rep_consent,
    note:               data.note,
  });

  return renderMultipleHtmlToPdf([
    buildReportHTML(data),
    buildRegulationHTML(regulationText, data.signature_data),
  ]);
}
