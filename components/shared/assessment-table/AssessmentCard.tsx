"use client"
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

const generatePDF = async (html: string, fileName: string) => {
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    // Sanitize the HTML by removing any invisible characters (e.g., non-breaking spaces, zero-width spaces)
    const sanitizedHTML = html
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
      .replace(/&nbsp;/g, " ")  // Remove non-breaking spaces
      .replace(/['"’]/g, "");   // Remove unwanted quotes if any
    
    // Create a container for the sanitized HTML
    const container = document.createElement("div");
    container.innerHTML = sanitizedHTML;
    document.body.appendChild(container);

    // Add the logo to the container
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

    // PDF options
    const opt = {
      margin: 0.5,
      filename: `${fileName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY,
        removeContainer: true,
        allowTaint: true,
        imageTimeout: 0,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".achievement-pair", "thead"],
      },
    };

    // Generate the PDF
    await html2pdf()
      .set(opt)
      .from(container)
      .toPdf()
      .get("pdf")
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          const logoImg = new Image();
          logoImg.src = "/pdf_logo.png";
          pdf.saveGraphicsState();
          pdf.setGState(new pdf.GState({ opacity: 0.7 }));
          pdf.addImage(
            logoImg,
            "PNG",
            pdf.internal.pageSize.width - 0.8,
            pdf.internal.pageSize.height - 0.7,
            0.5,
            0.5
          );
          pdf.restoreGraphicsState();
        }
      })
      .save();

    // Clean up the container after PDF generation
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};



export default function AssessmentCard({ href, course }: { 
  href: string, 
  course: any,
}) {


  const handleAssessmentPlan = async (e: any) => {
  
    try {
      const response = await fetch('/api/generate-assessment-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          courseId: course._id, 
          academicYear: course.academic_year 
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const html = await response.text();
      console.log('Generated HTML:', html); // For debugging
      await generatePDF(html, 'assessment_report');
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error('Failed to download assessment report');
    }
  }
 
const handleCloReport = async (e: any) => {
  toast.success('It is under development');
}
  return (
    <>
    <main className='w-full h-full'>
        <Link
          href={href}
          className='flex relative justify-between items-center border border-gray-300 shadow-sm p-3 rounded-md text-[13px]'
        >
            <div className='flex flex-col gap-1'>
              <h2>Course Name : <span className='capitalize'>{course.course_name}</span></h2>
              <p>Course Code : <span className='capitalize'>{course.course_code}</span></p>
              <p>Section : <span className='capitalize'>{course.section}</span></p>
              <p>Type : <span className='capitalize'>{course.examType}</span></p>
              <p>Semester : <span className='capitalize'>{course.semister}</span></p>
            </div>
            <div className='z-50 flex flex-col gap-2 self-end bottom-3 '>
                <Button onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCloReport(e)}} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                   Dev-Testing 
                </Button>
                <Button onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAssessmentPlan(e)}} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    Generate Report
                </Button>
            </div>
        </Link>
    </main>

    </>
  )
}
