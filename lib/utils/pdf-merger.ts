import jsPDF from 'jspdf';

/**
 * Merges multiple PDF files into a single PDF file
 * @param pdfDataArray Array of PDF data in base64 format
 * @param fileName Name of the output file
 */
export async function mergePDFs(pdfDataArray: string[], fileName: string): Promise<void> {
  try {
    if (!pdfDataArray || pdfDataArray.length === 0) {
      throw new Error('No PDF data provided for merging');
    }

    // If there's only one PDF, just convert and save it
    if (pdfDataArray.length === 1) {
      // Convert base64 string to binary data
      const binary = atob(pdfDataArray[0].split(',')[1]);
      const array = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        array[j] = binary.charCodeAt(j);
      }
      
      // Create a blob and download it
      const blob = new Blob([array], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      return;
    }

    // For multiple PDFs, we'll use a simpler approach with the PDF-lib library
    // First, dynamically import the library
    const { PDFDocument } = await import('pdf-lib');
    
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();
    
    // Process each PDF
    for (let i = 0; i < pdfDataArray.length; i++) {
      const pdfData = pdfDataArray[i];
      
      // Skip empty data
      if (!pdfData) continue;
      
      // Convert base64 string to binary data
      const binary = atob(pdfData.split(',')[1]);
      const array = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        array[j] = binary.charCodeAt(j);
      }
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(array);
      
      // Copy all pages from the loaded PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }
    
    // Save the merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    
    // Create a blob and download it
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
    
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw error;
  }
}

/**
 * Captures PDF data from a jsPDF instance before it's saved
 * @param pdf jsPDF instance
 * @returns Base64 encoded PDF data
 */
export function capturePdfData(pdf: jsPDF): string {
  return pdf.output('datauristring');
}