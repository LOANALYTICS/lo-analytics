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
      th, td { border: 1px solid #000; padding: 8px; font-size: 14px; text-align: center; vertical-align: middle; box-sizing: border-box; }
      th.clo-text, td.clo-text { text-align: left; width: 280px; min-width: 280px; max-width: 280px; }
      td[rowspan] { vertical-align: middle; }
      
      /* Ensure proper column widths - match header and row cells */
      th.sno, td.sno, th:first-child, td:first-child { width: 60px; min-width: 60px; max-width: 60px; }
      th.weight, td.weight { width: 110px; min-width: 110px; max-width: 110px; }
      th.plos, td.plos { width: 80px; min-width: 80px; max-width: 80px; }
      th.method, td.method { width: 120px; min-width: 120px; max-width: 120px; }
done      th.assessment-results { width: 240px; min-width: 240px; max-width: 240px; }
      th.target, td.target, th.actual, td.actual { width: 120px; min-width: 120px; max-width: 120px; }
      .comment { word-wrap: break-word;width: 120px; min-width: 120px; max-width: 120px; }
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
      let currentY = margin;
      let pageNum = 1;
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
