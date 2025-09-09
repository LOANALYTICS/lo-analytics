export const addWatermarkToPDF = (pdf: any) => {
  pdf.saveGraphicsState();
  (pdf as any).setGState(new (pdf as any).GState({ opacity: 0.3 }));

  const watermarkImg = new Image();
  watermarkImg.src = "/favicon.png";

  pdf.addImage(
    watermarkImg,
    "PNG",
    pdf.internal.pageSize.width - 15,
    pdf.internal.pageSize.height - 15,
    10,
    10
  );

  pdf.restoreGraphicsState();
};

export const generatePDF = async (
  html: string,
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const pages = Array.from(tempDiv.querySelectorAll('.page-container')) as HTMLElement[];

    if (pages.length === 0) {
      pages.push(tempDiv as unknown as HTMLElement);
    }

    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      const container = document.createElement("div");
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = 'auto';
      container.style.height = 'auto';
      container.style.maxWidth = 'none';
      container.style.maxHeight = 'none';

      const fullHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0;
                padding: 0;
              }
              .page-break {
                page-break-before: always;
              }
              .container { 
                max-width: 100%; 
                margin: 0 auto; 
                padding: 20px;
              }
              .h2_class { 
                text-align: center; 
                margin: 10px 40px;
                font-size: 1em;
                font-weight:800;
              }
              .h2_classp { 
                text-align: center; 
                margin: 10px 0px;
                font-size: 2.5em;
                font-weight:800;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .logo { 
                max-width: 100%; 
                height: auto;
                display: block;
                margin: 0 auto;
              }
              table { 
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                margin-bottom: 60px;
                border: 1px solid black;
                border-radius: 10px;
                overflow: hidden;
              }
              th, td { 
                border: 1px solid black;
                padding: 8px;
                text-align: center;
                font-size: 12px;
                padding-top: 5px;
                padding-bottom: 10px;
              }
              th {
                background-color: #f2f2f2;
                padding-top: 20px;
                padding-bottom: 30px;
              }
              .total-col {
                background-color: #e6e6e6;
                font-weight: bold;
              }
              .grade-row-group {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .course-details {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 30px;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 5px;
              }
              .detail-item {
                display: flex;
                gap: 5px;
                font-size: 32px;
              }
              .detail-label {
                font-weight: bold;
                white-space: nowrap;
              }
              .performance-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 40px;
                margin-bottom: 20px;
                border: 1px solid black;
                border-radius: 10px;
                overflow: hidden;
                font-size: 20px;
              }
              .performance-table th, .performance-table td {
                border: 1px solid black;
                padding: 12px 15px;
                text-align: center;
                font-size: 32px;
                font-weight: 500;
              }
              .performance-table th {
                background-color: #f2f2f2;
                font-weight: bold;
                font-size: 36px;
                padding: 15px 20px;
                white-space: normal;
                word-wrap: break-word;
                line-height: 1.2;
              }
              .performance-cell {
                font-size: 32px;
                font-weight: 500;
                line-height: 1.2;
                font-weight: bold;
              }
              .summary-section h3 {
                font-size: 16px !important;
                font-weight: bold !important;
                text-align: center !important;
                margin: 50px 0 !important;
                color: #333 !important;
              }
              .summary-section div {
                font-size: 14px !important;
                line-height: 1.4 !important;
                text-align: left !important;
              }
              .summary-section p {
                font-size: 14px !important;
                margin: 10px 0 !important;
                line-height: 1.4 !important;
              }
              .performance-score { font-weight: bold; }
              .performance-zscore { color: #666; }
              .low { color: #d32f2f; }
              .average { color: #f57c00; }
              .high { color: #388e3c; }
            </style>
          </head>
          <body>
            ${page.outerHTML}
          </body>
        </html>
      `;

      container.innerHTML = fullHTML;
      document.body.appendChild(container);

      const images = Array.from(container.getElementsByTagName('img'));
      await Promise.all(images.map(img => new Promise<void>((resolve) => {
        if ((img as HTMLImageElement).complete) resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
      })));

      const canvas = await html2canvas(container as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const maxImgWidth = pageWidth - 2 * margin;
      const maxImgHeight = pageHeight - 2 * margin;
      const pxPerMm = canvas.width / (canvas.width / 2.83465);
      const imgProps = { width: canvas.width, height: canvas.height };
      const widthScale = maxImgWidth / (imgProps.width / pxPerMm);
      const heightScale = maxImgHeight / (imgProps.height / pxPerMm);

      let scale: number, pdfWidth: number, pdfHeight: number, x: number, y: number;
      if (i === 1) {
        scale = Math.min(widthScale, heightScale);
        pdfWidth = (imgProps.width / pxPerMm) * scale;
        pdfHeight = (imgProps.height / pxPerMm) * scale;
        x = (pageWidth - pdfWidth) / 2;
        y = margin;
      } else {
        scale = Math.min(widthScale, heightScale);
        pdfWidth = (imgProps.width / pxPerMm) * scale;
        pdfHeight = (imgProps.height / pxPerMm) * scale;
        x = (pageWidth - pdfWidth) / 2;
        y = margin;
      }

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(canvas, 'JPEG', x, y, pdfWidth, pdfHeight);
      addWatermarkToPDF(pdf);
      document.body.removeChild(container);
    }

    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const generateLandscapePDFSinglePage = async (html: string, fileName: string) => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    const container = document.createElement("div");
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = 'auto';
    container.style.height = 'auto';
    container.style.maxWidth = 'none';
    container.style.maxHeight = 'none';
    container.style.minWidth = '0';
    container.style.minHeight = '0';
    container.innerHTML = html;
    document.body.appendChild(container);

    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => new Promise<void>((resolve) => {
      if ((img as HTMLImageElement).complete) resolve();
      img.onload = () => resolve();
      img.onerror = () => resolve();
    })));

    const canvas = await html2canvas(container as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxImgWidth = pageWidth - 2 * margin;
    const maxImgHeight = pageHeight - 2 * margin;

    const pxPerMm = canvas.width / (canvas.width / 2.83465);
    const imgProps = { width: canvas.width, height: canvas.height };
    const widthScale = maxImgWidth / (imgProps.width / pxPerMm);
    const heightScale = maxImgHeight / (imgProps.height / pxPerMm);
    const scale = Math.min(widthScale, heightScale);
    const pdfWidth = (imgProps.width / pxPerMm) * scale;
    const pdfHeight = (imgProps.height / pxPerMm) * scale;
    const x = (pageWidth - pdfWidth) / 2;
    const y = (pageHeight - pdfHeight) / 2;

    pdf.addImage(canvas, 'JPEG', x, y, pdfWidth, pdfHeight);
    addWatermarkToPDF(pdf);
    pdf.save(`${fileName}.pdf`);
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const generatePDFWithJsPDF = async (
  html: string,
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    const container = document.createElement("div");
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = 'auto';
    container.style.minWidth = 'fit-content';
    container.style.maxWidth = 'none';
    container.innerHTML = html;
    document.body.appendChild(container);

    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => new Promise<void>((resolve) => {
      if ((img as HTMLImageElement).complete) resolve();
      img.onload = () => resolve();
      img.onerror = () => resolve();
    })));

    const canvas = await html2canvas(container as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const margin = 10;
    const imgWidth = orientation === 'portrait' ? 210 - (margin * 2) : 297 - (margin * 2);
    const pageHeight = orientation === 'portrait' ? 297 - (margin * 2) : 210 - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const tolerance = 5;

    if (imgHeight <= pageHeight + tolerance) {
      pdf.addImage(canvas, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      const scale = pageHeight / imgHeight;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = pageHeight;
      const xOffset = margin + (imgWidth - scaledWidth) / 2;
      pdf.addImage(canvas, 'JPEG', xOffset, margin, scaledWidth, scaledHeight);
    }

    addWatermarkToPDF(pdf);
    pdf.save(`${fileName}.pdf`);
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};


