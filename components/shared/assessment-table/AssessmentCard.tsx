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
import { generatePDF, generateLandscapePDFSinglePage, generatePDFWithJsPDF } from '@/lib/utils/pdf';
import { generatePloPdfFromHtml, generateCommentsPdfFromHtml } from '@/lib/utils/plo-pdf';
import { mergePDFs } from '@/lib/utils/pdf-merger';

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
      toast.loading("Generating reports")
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
  
      // Parse JSON response with HTML contents and plogroups for AI analysis
      const data = await response.json();
      const { cloHtml, ploHtml, plogroups } = data;
      
      // Array to store PDF data
      const pdfDataArray: string[] = [];
      
      // Create temporary container for CLO HTML
      const cloContainer = document.createElement('div');
      cloContainer.innerHTML = cloHtml;
      document.body.appendChild(cloContainer);
  
      // Wait for Plotly chart to render in CLO report
      await new Promise((resolve) => {
        const checkChart = setInterval(() => {
          const chartDiv = cloContainer.querySelector('#achievementChart');
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
      
      // Generate CLO PDF and capture data instead of saving
      console.log('Generating CLO PDF');
      const cloPdfData = await generatePDFWithJsPDF(cloContainer.innerHTML, `${course?.course_code} CLO Report`, 'portrait', false) as string;
      console.log('CLO PDF generated successfully');
      document.body.removeChild(cloContainer);
      if (cloPdfData) {
        console.log('Adding CLO PDF data to array');
        pdfDataArray.push(cloPdfData);
        console.log(`PDF data array now has ${pdfDataArray.length} items`);
      } else {
        console.error('CLO PDF data is null or undefined');
      }
      
      // Generate PLO PDF and capture data instead of saving
      try {
        // Generate PLO PDF directly from HTML string
        console.log('Generating PLO PDF');
        const ploPdfData = await generatePloPdfFromHtml(ploHtml, `${course?.course_code} PLO Report`, false) as string;
        console.log('PLO PDF generated successfully');
        
        if (ploPdfData) {
          console.log('Adding PLO PDF data to array');
          pdfDataArray.push(ploPdfData);
          console.log(`PDF data array now has ${pdfDataArray.length} items`);
        } else {
          console.error('PLO PDF data is null or undefined');
        }
      } catch (ploError) {
        console.error("Error generating PLO report:", ploError);
        toast.error('Failed to generate PLO report');
      }

      // Generate AI Analysis Report (third report)
      try {
        toast.loading("Generating reports");
        
        const aiResponse = await fetch('/api/generate-ai-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            plogroups
          }),
        });

        if (!aiResponse.ok) {
          console.error('analysis failed');
          toast.error('analysis failed');
        } else {
          const aiData = await aiResponse.json();
          const { commentsHtml } = aiData;
          
          console.log('Generating AI Analysis PDF');
          const aiPdfData = await generateCommentsPdfFromHtml(commentsHtml, `${course?.course_code} AI Analysis Report`, false) as string;
          console.log('AI Analysis PDF generated successfully');
          
          if (aiPdfData) {
            console.log('Adding AI Analysis PDF data to array');
            pdfDataArray.push(aiPdfData);
            console.log(`PDF data array now has ${pdfDataArray.length} items`);
          } else {
            console.error('AI Analysis PDF data is null or undefined');
          }
        }
      } catch (aiError) {
        console.error("Error generating AI analysis report:", aiError);
        toast.error('Failed to generate AI analysis report');
      }
      
      // Merge and save PDFs
      if (pdfDataArray.length > 0) {
        toast.loading("Merging reports");
        try {
          console.log(`Attempting to merge ${pdfDataArray.length} PDFs`);
          console.log(`CLO PDF data length: ${pdfDataArray[0]?.length || 0}`);
          if (pdfDataArray.length > 1) {
            console.log(`PLO PDF data length: ${pdfDataArray[1]?.length || 0}`);
          }
          if (pdfDataArray.length > 2) {
            console.log(`AI Analysis PDF data length: ${pdfDataArray[2]?.length || 0}`);
          }
          await mergePDFs(pdfDataArray, `${course?.course_code} Combined Reports`);
          toast.success('Combined reports generated successfully');
        } catch (mergeError) {
          console.error("Error merging PDFs:", mergeError);
          toast.error('Failed to merge reports');
        }
      }
      
      toast.dismiss();
  
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