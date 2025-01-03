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
    });

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
