"use client"
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser } from '@/server/utils/helper';

const generatePDF = async (html: string, fileName: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    // Split HTML into pages based on page-break divs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const pages = Array.from(tempDiv.querySelectorAll('.page-container'));
    
    if (pages.length === 0) {
      // Fallback: treat entire content as one page
      pages.push(tempDiv);
    }

    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      
      // Create container for this page with full HTML including styles
      const container = document.createElement("div");
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = 'auto';
      container.style.height = 'auto';
      container.style.maxWidth = 'none';
      container.style.maxHeight = 'none';
      
      // Create full HTML document with styles for this page
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
                margin: 10px 0;
                font-size: 1.8em;
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
                margin-top: 20px;
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
                padding: 12px 15px;
              }
              .performance-score {
                font-weight: bold;
              }
              .performance-zscore {
                color: #666;
              }
              
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

      // Add logo
      const logo = document.createElement("img");
      logo.src = "/pdf_logo.png";
      logo.style.position = "fixed";
      logo.style.bottom = "20px";
      logo.style.right = "5px";
      logo.style.width = "50px";
      logo.style.height = "50px";
      logo.style.opacity = "0.5";
      logo.style.zIndex = "1000";
      container.appendChild(logo);

      // Wait for images
      const images = Array.from(container.getElementsByTagName('img'));
      await Promise.all(images.map(img => {
        return new Promise<void>((resolve) => {
          if (img.complete) resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }));

      // Render to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Calculate scale to fit page - prioritize width scaling for better space usage
      const maxImgWidth = pageWidth - 2 * margin;
      const maxImgHeight = pageHeight - 2 * margin;
      const pxPerMm = canvas.width / (canvas.width / 2.83465);
      const imgProps = { width: canvas.width, height: canvas.height };
      const widthScale = maxImgWidth / (imgProps.width / pxPerMm);
      const heightScale = maxImgHeight / (imgProps.height / pxPerMm);
      
      // Simple approach: use the smaller of the two scales to ensure it fits
      let scale = Math.min(widthScale, heightScale);
      
      const pdfWidth = (imgProps.width / pxPerMm) * scale;
      const pdfHeight = (imgProps.height / pxPerMm) * scale;
      
      // Position at top with minimal margin instead of center
      const x = (pageWidth - pdfWidth) / 2;
      const y = margin; // Start from top margin instead of centering

      // Add new page if not first
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(canvas, 'JPEG', x, y, pdfWidth, pdfHeight);
      document.body.removeChild(container);
    }

    pdf.save(`${fileName}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
const generateLandscapePDFSinglePage = async (html: string, fileName: string) => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    // Create container with NO fixed width or height
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

    // Wait for images
    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    // Render to canvas (let html2canvas determine the width)
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // PDF page size in mm
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
    const margin = 10; // 10mm margin on all sides
    const maxImgWidth = pageWidth - 2 * margin;
    const maxImgHeight = pageHeight - 2 * margin;

    // Calculate scale to fit both width and height
    const pxPerMm = canvas.width / (canvas.width / 2.83465); // 1mm ≈ 2.83465px at 72dpi
    const imgProps = {
      width: canvas.width,
      height: canvas.height
    };
    const widthScale = maxImgWidth / (imgProps.width / pxPerMm);
    const heightScale = maxImgHeight / (imgProps.height / pxPerMm);
    const scale = Math.min(widthScale, heightScale);
    const pdfWidth = (imgProps.width / pxPerMm) * scale;
    const pdfHeight = (imgProps.height / pxPerMm) * scale;
    const x = (pageWidth - pdfWidth) / 2;
    const y = (pageHeight - pdfHeight) / 2;

    pdf.addImage(canvas, 'JPEG', x, y, pdfWidth, pdfHeight);

    pdf.save(`${fileName}.pdf`);
    document.body.removeChild(container);

  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

const generatePDFWithJsPDF = async (html: string, fileName: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    // Create container with proper scaling for table content
    const container = document.createElement("div");
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = 'auto';
    container.style.minWidth = 'fit-content';
    container.style.maxWidth = 'none';
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for images
    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }));

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Calculate dimensions with margins
    const margin = 10; // 15mm margin on all sides
    const imgWidth = orientation === 'portrait' ? 210 - (margin * 2) : 297 - (margin * 2); // A4 width minus margins
    const pageHeight = orientation === 'portrait' ? 297 - (margin * 2) : 210 - (margin * 2); // A4 height minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    
    // Add a small tolerance to prevent unnecessary scaling
    const tolerance = 5; // 5mm tolerance

    // If content fits on one page (with tolerance), add it with margins
    if (imgHeight <= pageHeight + tolerance) {
      pdf.addImage(canvas, 'JPEG', margin, margin, imgWidth, imgHeight);
    } else {
      // Scale down to fit one page with margins
      const scale = pageHeight / imgHeight;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = pageHeight;
      const xOffset = margin + (imgWidth - scaledWidth) / 2;
      pdf.addImage(canvas, 'JPEG', xOffset, margin, scaledWidth, scaledHeight);
    }

    pdf.save(`${fileName}.pdf`);
    document.body.removeChild(container);

  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export default function AssessmentCard({ href, course, standalone }: { 
  href: string, 
  course: any,
  standalone?: boolean
}) {
  const [coordinator, setCoordinator] = useState<any>();

  useEffect(() => {
    const fetchCoordinator = async () => {
      const user = await getCurrentUser()
      setCoordinator(user)
    };
    fetchCoordinator()
  }, [course._id]);

  const handleAssessmentPlan = async (e: any) => {
    try {
      toast.loading("Generating report")
      const response = await fetch('/api/generate-clo-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseId: course._id, 
          academicYear: course.academic_year,
          coordinator:coordinator?.name
        }),
      });
  
      if (!response.ok) {
        toast.warning('Something went wrong!')
        return
      };
  
      const html = await response.text();
   
      
      // Create temporary container
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      document.body.appendChild(tempContainer);
  
      // Wait for Plotly chart to render
      await new Promise((resolve) => {
        const checkChart = setInterval(() => {
          const chartDiv = tempContainer.querySelector('#achievementChart');
          if (chartDiv && chartDiv.querySelector('.main-svg')) {
            clearInterval(checkChart);
            resolve(true);
          }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkChart);
          resolve(false);
        }, 5000);
      });
      
      await generatePDFWithJsPDF(tempContainer.innerHTML,`${course?.course_code} CLO Report`);
      toast.dismiss();
      toast.success('Report generated successfully');
      document.body.removeChild(tempContainer);
  
    } catch (error: any) {
      console.error("Error generating report:", error);
      if(error?.message === "Assessment data not found"){
        toast.error('Assessment not found');
      }else{
        toast.error('Failed to download assessment report');
      }
    }
  }
  
 
const handleCloReport = async (e: any, id: string, ace_year: string, section: string) => {
  e.preventDefault()
  e.stopPropagation()

  if(!id){
    toast.error('ID required');
    return;
  }

  try {
    toast.loading("Generating report")
    const response = await fetch(`/api/generate-plo-report?perc=${60}&courseId=${id}&academicYear=${ace_year}&section=${section}&coordinator=${coordinator?.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const html = await response.text();
    toast.loading("Generating report")
    await generateLandscapePDFSinglePage(html, `${course?.course_code} PLO Report`);
    toast.dismiss();
    toast.success('Report generated successfully');

  } catch (error: any) {
    console.error("Error generating CLO report:", error);
    toast.error(error.response?.data?.message || 'Failed to generate report');
  }
}

const handleStudentOutcome = async(e: any, id: string, ace_year: string, section: string) => {
  e.preventDefault()
  e.stopPropagation()

  if(!id || !ace_year || !section) {
    toast.error('Required parameters missing');
    return;
  }

  try {
    toast.loading("Generating report")
    const response = await fetch(`/api/so-report?courseId=${id}&academicYear=${ace_year}&section=${section}&coordinator=${coordinator?.name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const html = await response.text();
    await generatePDF(html, `${course?.course_code} SO Report`,'portrait');
    toast.dismiss();
    toast.success('Report generated successfully');

  } catch (error: any) {
    console.error("Error generating SO report:", error);
    toast.error(error.message || 'Failed to generate report');
  }
}

  return (
    <>
    <main className='w-full h-full hover:shadow-md transition-all duration-300 hover:translate-y-[-1px] group'>
        {
        standalone ?
        (

          <div
          className='flex relative gap-2 justify-between items-center border border-gray-300 group-hover:border-blue-400 shadow-sm p-3 rounded-md text-[13px]'
        >
            <div className='flex flex-col gap-1'>
              <h2>Course Name : <span className='capitalize'>{course.course_name}</span></h2>
              <p>Course Code : <span className='capitalize'>{course.course_code}</span></p>
              <p>Section : <span className='capitalize'>{course.section}</span></p>
              <p>Type : <span className='capitalize'>{course.examType}</span></p>
              <p>Semester : <span className='capitalize'>{course.semister  == 1 ? 'First Semester' : 'Second Semester'}</span></p>
            </div>
          
            <div className='z-50 flex flex-col gap-2 self-end bottom-3 '>
            <Button onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleStudentOutcome(e,course?._id, course?.academic_year, course?.section)}} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    S.O - Report
                </Button>
                <Button onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAssessmentPlan(e)}} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    CLO - Report
                </Button>
               
                    <Button
                    onClick={(e)=>handleCloReport(e,course?._id, course?.academic_year, course?.section)}
                    variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                      PLO - Report
                    </Button>
                    
          
            </div>
        </div>
        ):(
          <Link
          href={href}
          className='flex relative justify-between items-center border border-gray-300 group-hover:border-blue-400 shadow-sm p-3 rounded-md text-[13px]'
        >
            <div className='flex flex-col gap-1'>
              <h2>Course Name : <span className='capitalize'>{course.course_name}</span></h2>
              <p>Course Code : <span className='capitalize'>{course.course_code}</span></p>
              <p>Section : <span className='capitalize'>{course.section}</span></p>
              <p>Type : <span className='capitalize'>{course.examType}</span></p>
              <p>Semester : <span className='capitalize'>{course.semister  == 1 ? 'First Semester' : 'Second Semester'}</span></p>
            </div>
           
        </Link>
        )
         
        }
    </main>

    </>
  )
}