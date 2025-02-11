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
import axios from 'axios';
import { getCurrentUser } from '@/server/utils/helper';

const generatePDF = async (html: string, fileName: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    // Sanitize the HTML by removing any invisible characters (e.g., non-breaking spaces, zero-width spaces)
    const sanitizedHTML = html
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
      .replace(/&nbsp;/g, " ")  // Remove non-breaking spaces
      .replace(/['"']/g, "");   // Remove unwanted quotes if any
    
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

    // PDF options with landscape orientation
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
        orientation: orientation,
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
      const response = await fetch('/api/generate-assessment-report', {
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
      
console.log(tempContainer.innerHTML)  
      // Generate PDF with the rendered content

      await generatePDF(tempContainer.innerHTML, 'assessment_report');
      toast.dismiss();
      toast.success('Report generated successfully');
      
      // Cleanup
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
  
 
const handleCloReport = async (e: any, percentage: number, id: string, ace_year: string, section: string) => {
  e.preventDefault()
  e.stopPropagation()

  if(!percentage || !id){
    toast.error('Percentage and ID required');
    return;
  }

  try {
    toast.loading("Generating report")
    const response = await fetch(`/api/generate-clo-report?perc=${percentage}&courseId=${id}&academicYear=${ace_year}&section=${section}&coordinator=${coordinator?.name}`, {
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
    await generatePDF(html, `clo_report_${percentage}`, 'landscape');
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
    await generatePDF(html, 'student_outcome_report', 'landscape');
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                      PLO - Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => handleCloReport(e, 60,course?._id, course?.academic_year, course?.section)}>Generate at 60%</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleCloReport(e, 70,course?._id, course?.academic_year, course?.section)}>Generate at 70%</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleCloReport(e, 80,course?._id, course?.academic_year, course?.section)}>Generate at 80%</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleCloReport(e, 90,course?._id, course?.academic_year, course?.section)}>Generate at 90%</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
          
            </div>
        </Link>
    </main>

    </>
  )
}