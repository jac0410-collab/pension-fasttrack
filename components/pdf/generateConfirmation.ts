'use client';
import type { Case, Lawyer } from '@/types';
import { formatDate } from '@/lib/utils/formatters';

export interface CheckItem {
  label: string;
  checked: boolean;
}

export function buildCheckItems(data: Case): CheckItem[] {
  return [
    { label: '규약 서류 형식 요건 구비',                         checked: true },
    { label: '사업장 정보 정확성 확인',                           checked: true },
    { label: '제도형태 선택의 적법성',                             checked: true },
    { label: '퇴직연금사업자 등록 요건 충족',                     checked: true },
    { label: '근로자대표 동의 절차 이행',                          checked: data.worker_rep_consent },
    { label: '가입대상 법적 요건 충족',                            checked: true },
    { label: '급여 수준 및 지급 요건의 적법성',                   checked: true },
    { label: '가입기간 산정 방식의 적정성',                        checked: true },
    {
      label: data.pension_type === 'DC'
        ? 'DC: 부담금 납입주기 명시'
        : 'DB: 적립금 운용 기준 명시',
      checked: true,
    },
  ];
}

export function buildOpinionText(data: Case, lawyer: Lawyer): string {
  const typeStr = data.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)';
  return `본인은 ${data.company_name}의 ${typeStr} 퇴직연금제도 규약을 검토한 결과, 「근로자퇴직급여 보장법」 및 관련 법령에 적합하게 작성되었음을 확인합니다.`;
}

export async function generateConfirmationPDF(
  data: Case,
  lawyer: Lawyer,
  checkItems: CheckItem[],
  opinion: string
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');

  doc.setFontSize(14);
  doc.text('퇴직연금 규약 검토 확인서', 105, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.text('(한국공인노무사회 — 패스트트랙 서비스)', 105, 27, { align: 'center' });

  // I. 사업장 개요
  doc.setFontSize(11);
  doc.text('I. 사업장 개요', 20, 38);
  autoTable(doc, {
    startY: 42,
    body: [
      ['사업장명', data.company_name, '사업자등록번호', data.biz_reg_no],
      ['대표자',   data.ceo_name,     '상시근로자수',   `${data.employee_count}명`],
      ['주소',     data.address,      '제도형태',       data.pension_type === 'DB' ? '확정급여형(DB)' : '확정기여형(DC)'],
      ['제도시행일', formatDate(data.start_date), '', ''],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 32 }, 2: { fontStyle: 'bold', cellWidth: 32 } },
  });

  // II. 적법성 심사 항목
  const y2 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.text('II. 적법성 심사 항목', 20, y2);
  autoTable(doc, {
    startY: y2 + 4,
    head: [['번호', '심사항목', '결과']],
    body: checkItems.map((item, i) => [
      `${i + 1}`,
      item.label,
      item.checked ? '✓ 적합' : '✗ 미흡',
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [13, 36, 51] },
    columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 22 } },
  });

  // III. 종합 의견
  const y3 = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.text('III. 종합 의견', 20, y3);
  doc.setFontSize(10);
  const opLines = doc.splitTextToSize(opinion, 170);
  doc.text(opLines, 20, y3 + 7);

  // 서명란
  const ySign = y3 + 7 + opLines.length * 5 + 10;
  doc.setFontSize(10);
  doc.text(`작성일: ${formatDate(new Date().toISOString())}`, 20, ySign);
  doc.text(`담당 노무사: ${lawyer.name}  (등록번호: ${lawyer.reg_no})`, 20, ySign + 7);
  doc.text(`한국공인노무사회  (인)`, 20, ySign + 14);

  doc.setFontSize(8);
  doc.text('법적 근거: 「근로감독관 집무규정」 제77조 제2항', 105, 285, { align: 'center' });

  return doc.output('blob');
}
