import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(htmlContent: string, filename: string = 'download.pdf'): Promise<void> {
  try {
    // Create a temporary div to hold the HTML content
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.padding = '20px';
    document.body.appendChild(element);

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions to fit the content
    const imgWidth = 190; // Reduced from 210 to allow for margins
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF with margins
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.98),
      'JPEG',
      10, // Left margin in mm
      10, // Top margin in mm
      imgWidth,
      imgHeight
    );

    // Download PDF
    pdf.save(filename);

    // Clean up
    document.body.removeChild(element);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
} 