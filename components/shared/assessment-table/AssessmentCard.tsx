"use client"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

const generatePDF = async (html: string, fileName: string) => {
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

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
        before: ".table-container",
        avoid: [".row-pair", "thead"],
      },
    };

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

  return (
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
            <div className='absolute right-3 bottom-3 space-x-2'>
                <Button onClick={handleAssessmentPlan} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    Generate Report
                </Button>
            </div>
        </Link>
    </main>
  )
}
