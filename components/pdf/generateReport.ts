'use client';
import type { Case } from '@/types';
import { formatDate } from '@/lib/utils/formatters';
import { renderHtmlToPdf } from './renderHtmlToPdf';

export function buildReportHTML(data: Case): string {
  const typeCheck = (t: string) =>
    data.pension_type === t ? '☑' : '☐';

  const opinionDate = data.opinion_date
    ? formatDate(data.opinion_date)
    : '      년      월      일';

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans KR', sans-serif; font-size:10pt; color:#000;
         width:190mm; padding:10mm 10mm; background:#fff; }
  h1 { text-align:center; font-size:16pt; font-weight:700; margin:6mm 0 2mm; letter-spacing:2px; }
  .subtitle { text-align:center; font-size:8pt; margin-bottom:4mm; }
  .notice { font-size:8pt; margin-bottom:3mm; }
  table { width:100%; border-collapse:collapse; }
  td, th { border:1px solid #000; padding:2mm 3mm; vertical-align:middle; font-size:9pt; }
  .label { background:#f0f0f0; font-weight:700; white-space:nowrap; width:30mm; }
  .label2 { background:#f0f0f0; font-weight:700; white-space:nowrap; }
  .header-row td { text-align:center; }
  .section-label { background:#f0f0f0; font-weight:700; width:15mm; text-align:center;
                    writing-mode:vertical-lr; text-orientation:mixed; }
  .type-row td { line-height:1.8; }
  .sig-section { margin-top:6mm; font-size:9pt; line-height:2; }
  .sig-section p { margin:1mm 0; }
  .attach { margin-top:4mm; }
  .attach table td { font-size:8.5pt; }
  .footer { text-align:right; font-size:7.5pt; margin-top:3mm; color:#555; }
  .checkbox { font-size:12pt; }
  .form-no { font-size:7.5pt; margin-bottom:2mm; }
</style>
</head>
<body>
<p class="form-no">■ 근로자퇴직급여 보장법 시행규칙 [별지 제1호서식] &lt;개정 2019. 7. 26.&gt;</p>

<div style="text-align:center; margin-bottom:2mm;">
  <span class="checkbox">${typeCheck('DB')}</span> 확정급여형&nbsp;&nbsp;
  <span class="checkbox">${typeCheck('DC')}</span> 확정기여형&nbsp;&nbsp;
  <span class="checkbox">☐</span> 혼합형
</div>
<h1>퇴직연금규약 신고서</h1>
<p class="subtitle">※ 뒤쪽 작성요령을 읽고 작성하여 주시기 바라며, [ ]에는 해당되는 곳에 "√" 표시를 합니다. (앞쪽)</p>

<table style="margin-bottom:3mm;">
  <tr class="header-row">
    <td style="width:25%;">발급번호</td>
    <td style="width:25%;">접수일</td>
    <td style="width:25%;">발급일</td>
    <td style="width:25%;">처리기간&nbsp;&nbsp;7일</td>
  </tr>
</table>

<table>
  <tr>
    <td rowspan="9" class="section-label">신<br>고<br>내<br>용</td>
    <td class="label">사업명(사업장명)</td>
    <td colspan="3">${data.company_name}</td>
    <td class="label2">사업자등록번호<br>(법인등록번호)</td>
    <td colspan="2">${data.biz_reg_no}</td>
  </tr>
  <tr>
    <td class="label">대표자 성명</td>
    <td colspan="3">${data.ceo_name}</td>
    <td class="label2">업종(주산품)</td>
    <td colspan="2">${data.industry ?? ''}</td>
  </tr>
  <tr>
    <td class="label">상시 근로자 수</td>
    <td colspan="3">${data.employee_count}명</td>
    <td class="label2">노동조합원 수</td>
    <td colspan="2">0명</td>
  </tr>
  <tr>
    <td class="label">주소</td>
    <td colspan="6">${data.address}</td>
  </tr>
  <tr>
    <td class="label">전화번호</td>
    <td colspan="3">${data.phone ?? ''}</td>
    <td class="label2">팩스(Fax)번호</td>
    <td colspan="2">${data.fax_number ?? ''}</td>
  </tr>
  <tr>
    <td class="label" rowspan="3">퇴직급여제도<br>형 태</td>
    <td colspan="6" class="type-row">
      <span class="checkbox">${typeCheck('DB')}</span> 확정급여형퇴직연금제도&nbsp;&nbsp;&nbsp;
      <span class="checkbox">${typeCheck('DC')}</span> 확정기여형퇴직연금제도<br>
      <span class="checkbox">☐</span> 「근로자퇴직급여 보장법」 제6조에 따른 혼합형 퇴직연금제도<br>
      <span class="checkbox">☐</span> 퇴직금제도<br>
      <span style="font-size:8pt;">※ 해당 사업(사업장)에 적용되는 퇴직급여제도에 모두 표시합니다.</span>
    </td>
  </tr>
  <tr>
    <td class="label2" style="text-align:center;">의 견 청 취 일<br>또 는 동 의 일</td>
    <td colspan="6" style="text-align:center;">${opinionDate}</td>
  </tr>
</table>

<div class="sig-section">
  <p>「근로자퇴직급여 보장법」 제13조·제19조 및 같은 법 시행규칙 제2조에 따라 위와 같이 퇴직연금규약을 신고(신규 / 변경)합니다.</p>
  <p style="margin-top:4mm; text-align:right;">${dateStr}</p>
  <p style="text-align:right; margin-top:2mm; line-height:1;">신고인(사업장 대표)&nbsp;&nbsp;&nbsp;${data.ceo_name}&nbsp;&nbsp;&nbsp;${data.signature_data ? `<img src="${data.signature_data}" style="width:28mm;height:12mm;object-fit:contain;vertical-align:middle;display:inline-block;" />` : '(서명 또는 인)'}</p>
  <p style="margin-top:3mm;">( ${data.labor_office ?? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'} )지방고용노동청장(지청장) 귀하</p>
</div>

<div class="attach">
  <table>
    <tr>
      <td rowspan="4" class="label" style="width:15mm; text-align:center;">첨부서류</td>
      <td>
        [신고의 경우]<br>
        1. 퇴직연금규약<br>
        2. 근로자대표의 동의를 받았거나 의견을 들었음을 증명하는 자료
      </td>
      <td rowspan="4" style="width:20mm; text-align:center;">수수료<br>없음</td>
    </tr>
    <tr>
      <td style="font-size:8pt;">
        [변경 통보의 경우]<br>
        1. 변경 전과 변경 후의 내용을 비교하여 작성한 퇴직연금규약<br>
        2. 근로자대표의 동의를 받았음을 증명하는 자료(근로자에게 불리한 변경의 경우만 해당합니다) 또는 근로자대표의 의견을 들었음을 증명하는 자료(근로자에게 불리한 변경이 아닌 경우만 해당합니다)
      </td>
    </tr>
  </table>
</div>

<p class="footer">210㎜×297㎜[백상지 80g/㎡]</p>
</body>
</html>`;
}

export async function generateReportPDF(data: Case): Promise<Blob> {
  return renderHtmlToPdf(buildReportHTML(data));
}
