import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function generatePloPdfFromHtml(html: string, fileName: string, saveImmediately: boolean = true): Promise<string | void> {
  try {
    // Create a temporary div to hold the HTML content
    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.width = "1000px"; // Set a fixed width to ensure proper rendering
    
    // Parse the HTML and enhance with additional styles
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const styleTags = Array.from(parsed.head?.querySelectorAll('style') || []);
    const inlineCss = styleTags.map(s => s.textContent || '').join('\n');
    
    // Enhanced base CSS with better print handling and table structure
    const baseCss = `
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { background: #fff; margin: 0; padding: 0; }
      table { background: #fff; border-collapse: collapse; width: 100%; table-layout: fixed; }
      
      /* Row-level page break control - critical for preventing row splits */
      tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      tr.clo-row { page-break-inside: avoid !important; break-inside: avoid !important; }
      tr.group-header { page-break-inside: avoid !important; break-inside: avoid !important; }
      
      /* Group-level page break control */
      tbody.group-block { page-break-inside: avoid !important; break-inside: avoid !important; }
      
      /* Table header repetition - only on first page */
      thead { display: table-header-group; visibility: visible !important; }
      tfoot { display: table-footer-group; }
      
      /* Ensure proper cell alignment and structure */
      th, td { border: 1px solid #000; padding: 6px; font-size: 12px; text-align: center; vertical-align: middle; box-sizing: border-box; }
      th.clo-text, td.clo-text { text-align: left; }
      td[rowspan] { vertical-align: middle; }
      
      /* Let template styles handle column widths - removed conflicting CSS */
      
      /* Comments styles removed - handled in separate function */
    `;
    
    // Set the enhanced HTML with all styles
    element.innerHTML = `<style>${baseCss}\n${inlineCss}</style>${parsed.body ? parsed.body.innerHTML : html}`;
    document.body.appendChild(element);
    
    // Wait for fonts and rendering
    try {
      await (document as any).fonts?.ready;
    } catch {}
    
    await new Promise(r => setTimeout(r, 500)); // Longer timeout for better rendering
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    }) as jsPDF & {
      GState: new (options: { opacity: number }) => any;
    };
    
    // Calculate dimensions for A4 page
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // margin in mm
    const contentWidth = pageWidth - (margin * 2); // content width in mm
    
    // Shared variables for positioning
    let currentY = margin;
    let pageNum = 1;
    
    // Function to process the table with proper headers and rows
    const processTable = async () => {
      // Get the table and its components
      const table = element.querySelector('table');
      const thead = element.querySelector('thead');
      const tbody = element.querySelectorAll('tbody');
      
      if (!table || !thead) {
        throw new Error("Table or header not found in the HTML");
      }
      
      // We'll include the real THEAD only once with the first content block to avoid jsPDF.scale issues
      let firstHeaderInlined = false;
      
      // Add table header at the very top before any group headers
      if (!firstHeaderInlined) {
        const headerContainer = document.createElement('div');
        const headerTable = document.createElement('table');
        headerTable.style.width = '100%';
        headerTable.style.borderCollapse = 'collapse';
        headerTable.style.tableLayout = 'fixed';
        const theadClone = thead.cloneNode(true) as HTMLElement;
        (theadClone as HTMLElement).style.display = 'table-header-group';
        headerTable.appendChild(theadClone);
        headerContainer.appendChild(headerTable);
        document.body.appendChild(headerContainer);
        
        const headerCanvas = await html2canvas(headerContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
        });
        
        document.body.removeChild(headerContainer);
        
        const headerWidthMM = contentWidth;
        const headerHeightMM = (headerCanvas.height * headerWidthMM) / headerCanvas.width;
        
        // Add header to the first page
        try {
          const headerDataUrl = headerCanvas.toDataURL("image/png");
          pdf.addImage(
            headerDataUrl,
            "PNG",
            margin,
            currentY,
            headerWidthMM,
            headerHeightMM
          );
          currentY += headerHeightMM;
          firstHeaderInlined = true;
        } catch (error) {
          console.warn("Error adding header image, will inline with first content:", error);
        }
      }
      
      // Process each tbody section (knowledge, skills, values)
      for (let i = 0; i < tbody.length; i++) {
        const section = tbody[i] as HTMLElement;
        const rows = section.querySelectorAll('tr');
        
        // Process the group header first
        const groupHeader = rows[0] as HTMLElement;
        if (groupHeader && groupHeader.classList.contains('group-header')) {
          // Create a proper table structure for the group header
          const groupHeaderContainer = document.createElement('div');
          const groupHeaderTable = document.createElement('table');
          groupHeaderTable.style.width = '100%';
          groupHeaderTable.style.borderCollapse = 'collapse';
          groupHeaderTable.style.tableLayout = 'fixed';
          const groupHeaderTbody = document.createElement('tbody');
          groupHeaderTbody.appendChild(groupHeader.cloneNode(true));
          groupHeaderTable.appendChild(groupHeaderTbody);
          groupHeaderContainer.appendChild(groupHeaderTable);
          document.body.appendChild(groupHeaderContainer);
          
          // Check if group header fits on current page
          const headerCanvas = await html2canvas(groupHeaderContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            allowTaint: true,
          });
          
          document.body.removeChild(groupHeaderContainer);
          
          const headerWidthMM = contentWidth;
          const headerHeightMM = (headerCanvas.height * headerWidthMM) / headerCanvas.width;
          
          // If group header doesn't fit, add a new page but don't add header to new pages
          if (currentY + headerHeightMM > pageHeight - margin) {
            pdf.addPage();
            pageNum++;
            currentY = margin;
            // No header on new pages - content starts at top margin
          }
          
          // Add group header
          try {
            const groupHeaderDataUrl = headerCanvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(
              groupHeaderDataUrl,
              "JPEG",
              margin,
              currentY,
              headerWidthMM,
              headerHeightMM
            );
          } catch (error) {
            console.warn("Error adding group header image, skipping:", error);
            // Continue without the group header if there's an error
          }
          
          currentY += headerHeightMM;
        }
        
        // Process data rows in pairs (direct and indirect)
        for (let j = 1; j < rows.length; j += 2) {
          const directRow = rows[j] as HTMLElement;
          const indirectRow = rows[j + 1] as HTMLElement;
          
          if (!directRow || !indirectRow) continue;
          
          // Create a temporary container with a table structure to properly preserve rowspans
          const tempContainer = document.createElement('div');
          const tempTable = document.createElement('table');
          tempTable.style.width = '100%';
          tempTable.style.borderCollapse = 'collapse';
          tempTable.style.tableLayout = 'fixed';
          
          // Clone the table structure to maintain proper formatting
          const tempTbody = document.createElement('tbody');
          // Header already added at the top, no need to inline here
          tempTbody.appendChild(directRow.cloneNode(true));
          tempTbody.appendChild(indirectRow.cloneNode(true));
          tempTable.appendChild(tempTbody);
          tempContainer.appendChild(tempTable);
          document.body.appendChild(tempContainer);
          
          // Render both rows together to preserve rowspan
          const pairCanvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            allowTaint: true,
          });
          
          document.body.removeChild(tempContainer);
          
          const pairWidthMM = contentWidth;
          const pairHeightMM = (pairCanvas.height * pairWidthMM) / pairCanvas.width;
          
          // Check if pair fits on current page
          if (currentY + pairHeightMM > pageHeight - margin) {
            pdf.addPage();
            pageNum++;
            currentY = margin;
            
            // Don't add table header to new pages
            // Just start with content at the top margin
          }
          
          // Add row pair to PDF
          try {
            const pairDataUrl = pairCanvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(
              pairDataUrl,
              "JPEG",
              margin,
              currentY,
              pairWidthMM,
              pairHeightMM
            );
          } catch (error) {
            console.warn("Error adding row pair image, skipping:", error);
            // Continue without this row pair if there's an error
          }
          
          currentY += pairHeightMM;
        }
      }
      
      return pageNum;
    };
    
    // Process the table with headers and rows
    const totalPages = await processTable();
    
    // Comments page processing removed - will be handled separately
    
    // Skip logo addition to avoid jsPDF.scale errors
    // This prevents the 'Invalid argument passed to jsPDF.scale' error
    // If logo is needed, implement a proper preloading mechanism before PDF generation
    
    // Clean up
    document.body.removeChild(element);

    // Either save immediately or return the PDF data
    if (saveImmediately) {
      pdf.save(`${fileName}.pdf`);
      return;
    } else {
      // Return data URI string for further processing
      return pdf.output('datauristring');
    }
  } catch (error) {
    console.error("Error generating PLO PDF:", error);
    throw error;
  }
}

export async function generateCommentsPdfFromHtml(html: string, fileName: string, saveImmediately: boolean = true): Promise<string | void> {
  try {
    // Create a temporary div to hold the HTML content
    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.width = "1000px";
    
    // Parse the HTML and enhance with additional styles
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const styleTags = Array.from(parsed.head?.querySelectorAll('style') || []);
    const inlineCss = styleTags.map(s => s.textContent || '').join('\n');
    
    // Comments-specific CSS
    const commentsCss = `
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { background: #fff; margin: 0; padding: 0; }
      
      /* Comments and Signature Page Styles */
      .comments-page { 
        page-break-before: always !important; 
        break-before: always !important; 
        page-break-inside: avoid !important; 
        break-inside: avoid !important; 
        width: 100%; 
        height: 100vh; 
        display: flex; 
        flex-direction: column; 
        padding: 20px; 
        box-sizing: border-box; 
      }
      .comments-content { flex: 0 0 auto; }
      .comments-content h3 { 
        font-size: 18px; 
        font-weight: bold; 
        margin-bottom: 15px; 
        color: #4b2e83; 
        text-align: left; 
      }
      .comment-category { margin-bottom: 20px; }
      .comment-category h4 { 
        font-size: 16px; 
        font-weight: bold; 
        margin-bottom: 8px; 
        color: #333; 
      }
      .comment-category ul { margin: 0; padding-left: 20px; }
      .comment-category li { 
        font-size: 14px; 
        margin-bottom: 5px; 
        line-height: 1.4; 
      }
      .error-message { 
        color: #d32f2f; 
        font-style: italic; 
        font-size: 14px; 
      }
      .signatures-bottom { 
        flex: 1 1 auto; 
        display: flex; 
        align-items: flex-end; 
        padding-bottom: 50px; 
      }
      .signature-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-end; 
        width: 100%; 
      }
      .signature-item { 
        text-align: center; 
        flex: 1; 
        margin: 0 10px; 
      }
      .signature-label { 
        font-size: 14px; 
        font-weight: bold; 
        margin-bottom: 5px; 
        color: #333; 
      }
      .signature-line { 
        border-bottom: 1px solid #000; 
        height: 1px; 
        margin: 20px 0 5px 0; 
        min-height: 30px; 
      }
      .signature-name { 
        font-size: 14px; 
        font-weight: bold; 
        margin-top: 5px; 
      }
    `;
    
    // Set the enhanced HTML with all styles
    element.innerHTML = `<style>${commentsCss}\n${inlineCss}</style>${parsed.body ? parsed.body.innerHTML : html}`;
    document.body.appendChild(element);
    
    // Wait for fonts and rendering
    try {
      await (document as any).fonts?.ready;
    } catch {}
    
    await new Promise(r => setTimeout(r, 500));
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    }) as jsPDF & {
      GState: new (options: { opacity: number }) => any;
    };
    
    // Calculate dimensions for A4 page
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // margin in mm
    const contentWidth = pageWidth - (margin * 2); // content width in mm
    
    // Render comments page
    const commentsCanvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });
    
    const commentsWidthMM = contentWidth;
    const commentsHeightMM = (commentsCanvas.height * commentsWidthMM) / commentsCanvas.width;
    
    // Add comments page to PDF
    try {
      const commentsDataUrl = commentsCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(
        commentsDataUrl,
        "JPEG",
        margin,
        margin,
        commentsWidthMM,
        commentsHeightMM
      );
    } catch (error) {
      console.warn("Error adding comments page image:", error);
      throw error;
    }
    
    // Clean up
    document.body.removeChild(element);

    // Either save immediately or return the PDF data
    if (saveImmediately) {
      pdf.save(`${fileName}.pdf`);
      return;
    } else {
      // Return data URI string for further processing
      return pdf.output('datauristring');
    }
  } catch (error) {
    console.error("Error generating Comments PDF:", error);
    throw error;
  }
}
