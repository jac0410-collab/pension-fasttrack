'use client';
import type { Case } from '@/types';
import { generateRegulation } from '@/lib/regulation/generator';

export async function generateRegulationPDF(data: Case): Promise<Blob> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');

  const typeStr = data.pension_type === 'DB' ? '확정급여형' : '확정기여형';
  doc.setFontSize(14);
  doc.text(`${typeStr}퇴직연금제도 규약`, 105, 20, { align: 'center' });

  const text = generateRegulation({
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

  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, 170);
  doc.text(lines, 20, 32);

  // 개인사업자 서명 삽입
  if (data.business_type === 'individual' && data.signature_data) {
    try {
      const pageH = doc.internal.pageSize.getHeight();
      doc.addImage(data.signature_data, 'PNG', 130, pageH - 40, 50, 20);
    } catch { /* 서명 이미지 오류 무시 */ }
  }

  return doc.output('blob');
}
