'use client';

async function htmlToCanvas(html: string): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default;

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:absolute;left:-9999px;top:0;width:794px;height:1200px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument!;
  iDoc.open();
  iDoc.write(html);
  iDoc.close();

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 1500);
  });
  await iDoc.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));

  const canvas = await html2canvas(iDoc.body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 794,
    windowWidth: 794,
  });

  document.body.removeChild(iframe);
  return canvas;
}

function addCanvasToDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  canvas: HTMLCanvasElement,
  isFirstDoc: boolean,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageW;
  const pageHeightPx = pageH * pxPerMm;

  let yOffset = 0;
  let firstSlice = isFirstDoc;

  while (yOffset < canvas.height) {
    if (!firstSlice) doc.addPage();
    firstSlice = false;

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
}

/** 단일 HTML → PDF Blob (Tailwind lab() 오류 방지용 iframe 격리) */
export async function renderHtmlToPdf(html: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const canvas = await htmlToCanvas(html);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addCanvasToDoc(doc, canvas, true);
  return doc.output('blob');
}

/** 여러 HTML 문서 → 하나의 PDF Blob (문서 순서대로 페이지 이어붙임) */
export async function renderMultipleHtmlToPdf(htmlList: string[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let isFirst = true;
  for (const html of htmlList) {
    const canvas = await htmlToCanvas(html);
    addCanvasToDoc(doc, canvas, isFirst);
    isFirst = false;
  }
  return doc.output('blob');
}
