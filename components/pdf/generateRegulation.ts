'use client';
import type { Case } from '@/types';
import { generateRegulation } from '@/lib/regulation/generator';
import { renderHtmlToPdf } from './renderHtmlToPdf';

export function buildRegulationHTML(text: string, signatureData?: string): string {
  const lines = text.split('\n');
  const html = lines.map((line) => {
    if (!line.trim()) return '<br>';
    // 장 제목
    if (/^제\s*\d+\s*장/.test(line.trim())) {
      return `<p class="chapter">${line}</p>`;
    }
    // 조 제목
    if (/^제\d+조/.test(line.trim())) {
      return `<p class="article">${line}</p>`;
    }
    // 부칙
    if (/^부\s*칙/.test(line.trim())) {
      return `<p class="chapter">${line}</p>`;
    }
    // 규약명 제목
    if ((line.includes('확정급여형퇴직연금제도 규약') || line.includes('확정기여형퇴직연금제도 규약')) && !line.startsWith('이')) {
      return `<p class="title">${line}</p>`;
    }
    if (line.startsWith('제정')) {
      return `<p class="subtitle">${line}</p>`;
    }
    // 대표자 서명란
    if (line.startsWith('대표자 :') && signatureData) {
      const nameOnly = line.replace(/\(인\)\s*$/, '').trimEnd();
      return `<p class="body">${nameOnly}&nbsp;<img src="${signatureData}" style="width:28mm;height:12mm;object-fit:contain;vertical-align:middle;display:inline-block;" /></p>`;
    }
    return `<p class="body">${line}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans KR', sans-serif; font-size:10pt; color:#000;
         width:190mm; padding:15mm 15mm; background:#fff; line-height:1.8; }
  .title { text-align:center; font-size:15pt; font-weight:700; margin:4mm 0 2mm; }
  .subtitle { text-align:center; font-size:10pt; margin-bottom:6mm; color:#333; }
  .chapter { font-size:11pt; font-weight:700; margin:6mm 0 2mm;
              padding:1mm 0; border-bottom:1px solid #000; }
  .article { font-weight:700; margin-top:3mm; }
  .body { text-indent:0; margin:0.5mm 0; }
  br { display:block; margin:1mm 0; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

export async function generateRegulationPDF(data: Case): Promise<Blob> {
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

  return renderHtmlToPdf(buildRegulationHTML(text, data.signature_data));
}
