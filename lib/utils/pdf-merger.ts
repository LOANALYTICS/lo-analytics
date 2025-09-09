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
      console.log('Only one PDF to process, saving directly');
      // Convert base64 string to binary data
      let binary;
      try {
        // Handle both data URI format and raw base64
        if (pdfDataArray[0].includes('base64,')) {
          binary = atob(pdfDataArray[0].split('base64,')[1]);
        } else {
          binary = atob(pdfDataArray[0]);
        }
        console.log('Successfully decoded single PDF data');
      } catch (error) {
        console.error('Error decoding single PDF data:', error);
        console.log(`PDF data starts with: ${pdfDataArray[0].substring(0, 100)}...`);
        throw new Error('Failed to decode single PDF data');
      }
      
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

    // For multiple PDFs, we'll use the PDF-lib library
    // First, dynamically import the library
    const { PDFDocument } = await import('pdf-lib');
    
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();
    
    console.log(`Merging ${pdfDataArray.length} PDFs`);
    
    // Process each PDF
    for (let i = 0; i < pdfDataArray.length; i++) {
      const pdfData = pdfDataArray[i];
      
      // Skip empty data
      if (!pdfData) continue;
      
      // Convert base64 string to binary data
      let binary;
      try {
        // Handle both data URI format and raw base64
        if (pdfData.includes('base64,')) {
          binary = atob(pdfData.split('base64,')[1]);
        } else {
          binary = atob(pdfData);
        }
        console.log(`Successfully decoded PDF ${i+1} data`);
      } catch (error) {
        console.error(`Error decoding PDF ${i+1} data:`, error);
        console.log(`PDF data starts with: ${pdfData.substring(0, 100)}...`);
        continue; // Skip this PDF if we can't decode it
      }
      
      const array = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        array[j] = binary.charCodeAt(j);
      }
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(array);
      
      // Get page indices and log information
      const pageIndices = pdfDoc.getPageIndices();
      console.log(`PDF ${i+1} has ${pageIndices.length} pages`);
      
      // Copy all pages from the loaded PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
      console.log(`Copied ${copiedPages.length} pages from PDF ${i+1}`);
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
      
      console.log(`Merged PDF now has ${mergedPdf.getPageCount()} total pages`);
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