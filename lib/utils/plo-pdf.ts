import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generatePloPdfFromHtml(html: string, fileName: string, saveImmediately: boolean = true): Promise<string | void> {
  try {
    // Create a temporary div to hold the HTML content
    const element = document.createElement("div");
    element.innerHTML = html;
    element.style.padding = "20px";
    element.style.width = "1000px"; // Set a fixed width to ensure proper rendering
    document.body.appendChild(element);

    // Parse the HTML and inline styles if available
    try {
      const parser = new DOMParser();
      const parsed = parser.parseFromString(html, 'text/html');
      const styleTags = Array.from(parsed.head?.querySelectorAll('style') || []);
      const inlineCss = styleTags.map(s => s.textContent || '').join('\n');
      
      // Enhanced base CSS with better print handling
      const baseCss = `
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html, body { background: #fff; margin: 0; padding: 0; }
        table { background: #fff; border-collapse: collapse; width: 100%; }
        
        /* Enhanced pagination control */
        @media print {
          tr { page-break-inside: avoid !important; }
          tbody { page-break-inside: avoid !important; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .group-block { page-break-inside: avoid !important; }
        }
      `;
      
      element.innerHTML = `<style>${baseCss}\n${inlineCss}</style>${parsed.body ? parsed.body.innerHTML : html}`;
    } catch (error) {
      console.error("Parsing HTML failed:", error);
    }

    // Wait for fonts and rendering
    try {
      await (document as any).fonts?.ready;
    } catch {}

    await new Promise(r => setTimeout(r, 500)); // Longer timeout for better rendering

    // Convert HTML to canvas with higher quality settings
    const canvas = await html2canvas(element, {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      windowWidth: 1000, // Match the container width
      onclone: (clonedDoc) => {
        // Additional styling for the cloned document
        const clonedElement = clonedDoc.body.firstChild as HTMLElement;
        if (clonedElement) {
          clonedElement.style.width = "1000px";
        }
      }
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    }) as jsPDF & {
      GState: new (options: { opacity: number }) => any;
    };

    // Calculate dimensions
    const imgWidth = 190; // Slightly wider to maximize page usage
    const pageHeight = 287; // Reduced from 297 to account for margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10; // Starting position

    // Add image to PDF, creating new pages as needed
    let page = 1;
    while (heightLeft >= 0) {
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.98),
        "JPEG",
        10,
        position,
        imgWidth,
        imgHeight
      );

      // Add logo to each page
      pdf.saveGraphicsState();
      pdf.setGState(new pdf.GState({ opacity: 0.5 }));

      const logoImg = new Image();
      logoImg.src = "/pdf_logo.png";

      // Add logo to bottom right corner
      pdf.addImage(
        logoImg,
        "PNG",
        pdf.internal.pageSize.width - 25, // 25mm from right
        pdf.internal.pageSize.height - 25, // 25mm from bottom
        15, // width in mm
        15 // height in mm
      );

      pdf.restoreGraphicsState();

      heightLeft -= pageHeight;

      if (heightLeft > 0) {
        pdf.addPage();
        position = 10 - (imgHeight - pageHeight * page);
        page++;
      }
    }

    // Clean up
    document.body.removeChild(element);
    
    // Either save immediately or return the PDF data
    if (saveImmediately) {
      pdf.save(`${fileName}.pdf`);
      return;
    } else {
      return pdf.output('datauristring');
    }
  } catch (error) {
    console.error("Error generating PLO PDF:", error);
    throw error;
  }
}
