'use client';
import type { Case } from '@/types';
import { formatDate } from '@/lib/utils/formatters';

// jsPDF는 클라이언트에서만 dynamic import
export async function generateReportPDF(data: Case): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 한글 지원: 기본 폰트 사용 (실제 배포 시 Noto Sans KR 임베드 필요)
  doc.setFont('helvetica');
  doc.setFontSize(14);
  doc.text('퇴직연금 규약 신고서', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`(근로자퇴직급여 보장법 제13조 제1항)`, 105, 27, { align: 'center' });

  doc.setFontSize(10);
  const rows = [
    ['사업장명', data.company_name, '대표자', data.ceo_name],
    ['사업자등록번호', data.biz_reg_no, '상시근로자수', `${data.employee_count}명`],
    ['주소', data.address, '업종(주산품)', data.industry ?? ''],
    ['전화번호', data.phone ?? '', '팩스번호', data.fax_number ?? ''],
    ['제도형태', data.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)', '제도시행일', formatDate(data.start_date)],
    ['근로자대표 유형', data.worker_rep_type === 'union' ? '과반수 노조' : '근로자 과반수', '의견청취(동의)일', formatDate(data.opinion_date)],
    ['관할 지방고용노동청', data.labor_office ?? '', '', ''],
  ];

  autoTable(doc, {
    startY: 35,
    head: [['구분', '내용', '구분', '내용']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [13, 36, 51] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(`위와 같이 퇴직연금 규약을 신고합니다.`, 20, finalY);
  doc.text(formatDate(new Date().toISOString()), 20, finalY + 7);
  doc.text(`신고인: ${data.company_name} 대표 ${data.ceo_name}  (인)`, 20, finalY + 14);
  doc.text(`관할 지방고용노동청장 귀하`, 20, finalY + 21);

  doc.setFontSize(8);
  doc.text('법적 근거: 「근로감독관 집무규정」 제77조 제2항 — 패스트트랙 처리', 105, 285, { align: 'center' });

  return doc.output('blob');
}
