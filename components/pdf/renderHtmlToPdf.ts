'use client';

/**
 * HTML 문자열 → jsPDF Blob
 * iframe 안에서 렌더링해 Tailwind lab() 색상 오류를 회피합니다.
 */
export async function renderHtmlToPdf(html: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // iframe을 화면 밖에 생성 (페이지 CSS 완전 격리)
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:absolute;left:-9999px;top:0;width:794px;height:1200px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument!;
  iDoc.open();
  iDoc.write(html);
  iDoc.close();

  // Google Fonts + 레이아웃 완료 대기
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 1500); // onload가 이미 fired된 경우 fallback
  });
  await iDoc.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));

  const body = iDoc.body;
  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
  });

  document.body.removeChild(iframe);

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
    sliceCanvas.height = Math.ceil(sliceH);
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, -yOffset);

    doc.addImage(
      sliceCanvas.toDataURL('image/png'),
      'PNG', 0, 0,
      pageW,
      sliceH / pxPerMm,
    );
    yOffset += sliceH;
  }

  return doc.output('blob');
}
