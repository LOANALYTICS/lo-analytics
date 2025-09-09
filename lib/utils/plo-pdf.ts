export async function generatePloPdfFromHtml(html: string, fileName: string): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');

  // Create an overlay container
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = '100vw';
  host.style.height = '100vh';
  host.style.background = 'white';
  host.style.zIndex = '2147483647';
  host.style.overflow = 'auto';
  host.style.padding = '20px';
  host.style.boxSizing = 'border-box';
  host.style.display = 'block';

  // Create the content container
  const renderRoot = document.createElement('div');
  renderRoot.style.backgroundColor = '#ffffff';
  renderRoot.style.width = '100%';

  // Parse the HTML and inline styles if available
  try {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const styleTags = Array.from(parsed.head?.querySelectorAll('style') || []);
    const inlineCss = styleTags.map(s => s.textContent || '').join('\n');
    const baseCss = `
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { background: #fff; margin: 0; padding: 0; }
      table { background: #fff; border-collapse: collapse; }
    `;
    const bodyHTML = parsed.body ? parsed.body.innerHTML : html;
    renderRoot.innerHTML = `<style>${baseCss}\n${inlineCss}</style>${bodyHTML}`;
  } catch (error) {
    console.error("Parsing HTML failed:", error);
    const baseCss = `
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { background: #fff; margin: 0; padding: 0; }
    `;
    renderRoot.innerHTML = `<style>${baseCss}</style>${html}`;
  }

  host.appendChild(renderRoot);
  document.body.appendChild(host);

  // Wait for fonts and rendering
  try {
    await (document as any).fonts?.ready;
  } catch {}

  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['table','thead','tbody','tr','.group-block','.clo-row'] }
      })
      .from(renderRoot)
      .save();
  } catch (error) {
    console.error("PDF generation failed:", error);
    // Fallback to native print
    const w = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
    if (w) {
      const hasTitle = /<title>[\s\S]*?<\/title>/i.test(html);
      const content = hasTitle ? html : html.replace('<head>', `<head><title>${fileName}</title>`);
      w.document.open();
      w.document.write(content);
      w.document.close();
      try { await (w.document as any).fonts?.ready; } catch {}
      w.focus();
      w.print();
      setTimeout(() => { try { w.close(); } catch {} }, 1000);
    }
  } finally {
    try { document.body.removeChild(host); } catch {}
  }
}
