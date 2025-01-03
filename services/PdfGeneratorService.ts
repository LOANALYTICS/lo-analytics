import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generatePDF(
  htmlContent: string,
  filename: string = "download.pdf"
): Promise<void> {
  try {
    // Create a temporary div to hold the HTML content
    const element = document.createElement("div");
    element.innerHTML = htmlContent;
    element.style.padding = "20px";
    document.body.appendChild(element);

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
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
    const imgWidth = 190;
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

    // Download PDF
    pdf.save(filename);

    // Clean up
    document.body.removeChild(element);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
