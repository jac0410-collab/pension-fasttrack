'use client';
import type { Case } from '@/types';
import { generateRegulation } from '@/lib/regulation/generator';

function buildRegulationHTML(text: string): string {
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
    // 제목 (규약명, 제정)
    if (line.includes('퇴직연금제도 규약') && !line.includes('제')) {
      return `<p class="title">${line}</p>`;
    }
    if (line.startsWith('제정')) {
      return `<p class="subtitle">${line}</p>`;
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
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

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

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.innerHTML = buildRegulationHTML(text);
  document.body.appendChild(container);

  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 600));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
  });

  document.body.removeChild(container);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageW;
  const pageHeightPx = pageH * pxPerMm;

  let yOffset = 0;
  let firstPage = true;

  while (yOffset < canvas.height) {
    if (!firstPage) doc.addPage();
    firstPage = false;

    const sliceH = Math.min(pageHeightPx, canvas.height - yOffset);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceH;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, -yOffset);

    doc.addImage(
      sliceCanvas.toDataURL('image/png'),
      'PNG', 0, 0,
      pageW,
      (sliceH / pxPerMm),
    );
    yOffset += sliceH;
  }

  return doc.output('blob');
}
