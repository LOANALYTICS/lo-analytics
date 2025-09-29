"use client"
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getCurrentUser } from '@/server/utils/helper';
import { generatePDF, generateLandscapePDFSinglePage, generatePDFWithJsPDF } from '@/lib/utils/pdf';
import { generatePloPdfFromHtml, generateCommentsPdfFromHtml } from '@/lib/utils/plo-pdf';
import { mergePDFs } from '@/lib/utils/pdf-merger';
import { getDefaultAIComments } from '@/lib/utils/so-report-utils';

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

  const handleAssessmentPlan = async () => {
    const toastId = toast.loading("Generating report...");

    try {
      // Step 1: Calculate CLO report data
      const dataResponse = await fetch('/api/clo-report-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course._id,
          academicYear: course.academic_year
        }),
      });

      if (!dataResponse.ok) {
        toast.error('Failed to calculate report data');
        return;
      }

      const reportData = await dataResponse.json();

      // Step 2: Generate AI analysis using streaming
      let aiComments = {
        strengthPoints: ["Assessment data shows consistent performance patterns"],
        weaknessPoints: ["Some areas may need additional focus"],
        recommendations: ["Continue monitoring student progress"]
      };

      try {
        const response = await fetch('/api/ai-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: 'clo-report',
            data: { plogroups: reportData.plogroups }
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let finalResult = {};

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.substring(6);
                  const parsed = JSON.parse(jsonStr);

                  if (parsed.type === 'partial' && parsed.data) {
                    finalResult = { ...finalResult, ...parsed.data };
                  } else if (parsed.type === 'complete' && parsed.data) {
                    finalResult = parsed.data;
                    break;
                  }
                } catch (parseError) {
                  continue;
                }
              }
            }
          }

          if (finalResult && Object.keys(finalResult).length > 0) {
            aiComments = finalResult as typeof aiComments;
          }
        }
      } catch (aiError) {
        console.warn('AI analysis failed, using defaults:', aiError);
      }

      // Step 3: Generate HTML reports
      const htmlResponse = await fetch('/api/clo-report-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          coordinator: coordinator?.name,
          aiComments
        }),
      });

      if (!htmlResponse.ok) {
        throw new Error('Failed to generate HTML reports');
      }

      const { cloHtml, ploHtml } = await htmlResponse.json();

      // Step 4: Generate PDFs
      const pdfDataArray: string[] = [];

      // Create temporary container for CLO HTML
      const cloContainer = document.createElement('div');
      cloContainer.innerHTML = cloHtml;
      document.body.appendChild(cloContainer);

      // Wait for chart to render
      await new Promise((resolve) => {
        const checkChart = setInterval(() => {
          const chartDiv = cloContainer.querySelector('#achievementChart');
          if (chartDiv && chartDiv.querySelector('.main-svg')) {
            clearInterval(checkChart);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkChart);
          resolve(false);
        }, 5000);
      });

      // Generate CLO PDF
      const cloPdfData = await generatePDFWithJsPDF(cloContainer.innerHTML, `${course?.course_code} CLO Report`, 'portrait', false) as string;
      document.body.removeChild(cloContainer);
      if (cloPdfData) {
        pdfDataArray.push(cloPdfData);
      }

      // Generate PLO PDF
      try {
        const ploPdfData = await generatePloPdfFromHtml(ploHtml, `${course?.course_code} PLO Report`, false) as string;
        if (ploPdfData) {
          pdfDataArray.push(ploPdfData);
        }
      } catch (ploError) {
        console.error("Error generating PLO report:", ploError);
      }

      // Generate AI Analysis PDF
      try {
        const { generateCommentsReportHTML } = await import('@/templates/ploGroupReport');
        const commentsHtml = await generateCommentsReportHTML(aiComments);
        const aiPdfData = await generateCommentsPdfFromHtml(commentsHtml, `${course?.course_code} AI Analysis Report`, false) as string;
        if (aiPdfData) {
          pdfDataArray.push(aiPdfData);
        }
      } catch (aiError) {
        console.error("Error generating AI analysis report:", aiError);
      }

      // Step 5: Merge PDFs
      if (pdfDataArray.length > 0) {
        await mergePDFs(pdfDataArray, `${course?.course_code} Combined Reports`);
        toast.success('Report generated successfully', { id: toastId });
      } else {
        toast.error('No reports generated', { id: toastId });
      }

    } catch (error: any) {
      console.error("Error generating report:", error);
      if (error?.message === "Assessment data not found") {
        toast.error('Assessment not found', { id: toastId });
      } else {
        toast.error('Failed to generate report', { id: toastId });
      }
    }
  }



  const handleCloReport = async (e: any, id: string, ace_year: string, section: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!id) {
      toast.error('ID required');
      return;
    }

    const toastId = toast.loading("Generating report...");

    try {
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
      await generateLandscapePDFSinglePage(html, `${course?.course_code} PLO Report`);
      toast.success('Report generated successfully', { id: toastId });

    } catch (error: any) {
      console.error("Error generating PLO report:", error);
      toast.error(error.response?.data?.message || 'Failed to generate report', { id: toastId });
    }
  }

  const handleStudentOutcome = async (e: any, id: string, ace_year: string, section: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!id || !ace_year || !section) {
      toast.error('Required parameters missing');
      return;
    }

    const toastId = toast.loading("Generating report...");

    try {
      // Step 1: Calculate SO report data
      const dataResponse = await fetch(`/api/so-report-data?courseId=${id}&academicYear=${ace_year}&section=${section}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!dataResponse.ok) {
        throw new Error('Failed to calculate report data');
      }

      const reportData = await dataResponse.json();

      // Step 2: Generate AI analysis using streaming
      let aiComments = getDefaultAIComments(reportData.performanceCurveData);

      try {
        // Prepare AI analysis data
        const mean = reportData.performanceAnalysis.overall.mean;
        const stdDev = reportData.performanceAnalysis.overall.stdDev;

        // Generate normal distribution data
        const normalDistributionData = [];
        for (let x = 60; x <= 100; x++) {
          const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
          const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
          const value = coefficient * Math.exp(exponent) * 97;
          normalDistributionData.push({ x, value });
        }

        const soAnalysisData = {
          histogram: {
            scoreRanges: reportData.performanceCurveData.ranges,
            totalStudents: reportData.performanceCurveData.statistics.totalStudents,
            mean: parseFloat(reportData.performanceCurveData.statistics.mean),
            median: parseFloat(reportData.performanceCurveData.statistics.median),
            min: parseFloat(reportData.performanceCurveData.statistics.min),
            max: parseFloat(reportData.performanceCurveData.statistics.max)
          },
          bellCurve: {
            distribution: "normal",
            mean: mean,
            standardDeviation: stdDev,
            skewness: "slightly_left_skewed",
            dataPoints: normalDistributionData
          }
        };

        // Use Server-Sent Events streaming
        const response = await fetch('/api/ai-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: 'so-report',
            data: soAnalysisData
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let finalResult = {};

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.substring(6);
                  const parsed = JSON.parse(jsonStr);

                  if (parsed.type === 'partial' && parsed.data) {
                    finalResult = { ...finalResult, ...parsed.data };
                  } else if (parsed.type === 'complete' && parsed.data) {
                    finalResult = parsed.data;
                    break;
                  }
                } catch (parseError) {
                  continue;
                }
              }
            }
          }

          if (finalResult && Object.keys(finalResult).length > 0) {
            aiComments = {
              ...aiComments,
              ...finalResult,
              normalDistributionData
            } as any;
          } else {
            aiComments = {
              ...aiComments,
              normalDistributionData
            } as any;
          }
        }
      } catch (aiError) {
        console.warn('AI analysis failed, using defaults:', aiError);
      }

      // Step 3: Generate HTML report
      const htmlResponse = await fetch('/api/so-report-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          comments: aiComments,
          coordinator: coordinator?.name
        })
      });

      if (!htmlResponse.ok) {
        throw new Error('Failed to generate HTML report');
      }

      const html = await htmlResponse.text();

      // Step 4: Generate PDF
      await generatePDF(html, `${course?.course_code} SO Report`, 'portrait');

      toast.success('Report generated successfully', { id: toastId });

    } catch (error: any) {
      console.error("Error generating SO report:", error);
      toast.error(error.message || 'Failed to generate report', { id: toastId });
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
                  <p>Semester : <span className='capitalize'>{course.semister == 1 ? 'First Semester' : 'Second Semester'}</span></p>
                </div>

                <div className='z-50 flex flex-col gap-2 self-end bottom-3 '>
                  <Button onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStudentOutcome(e, course?._id, course?.academic_year, course?.section)
                  }} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    S.O - Report
                  </Button>
                  <Button onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAssessmentPlan()
                  }} variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    CLO - Report
                  </Button>

                  <Button
                    onClick={(e) => handleCloReport(e, course?._id, course?.academic_year, course?.section)}
                    variant='outline' size='sm' className='px-5 py-3 text-[11px] w-full h-fit font-bold'>
                    PLO - Report
                  </Button>


                </div>
              </div>
            ) : (
              <Link
                href={href}
                className='flex relative justify-between items-center border border-gray-300 group-hover:border-blue-400 shadow-sm p-3 rounded-md text-[13px]'
              >
                <div className='flex flex-col gap-1'>
                  <h2>Course Name : <span className='capitalize'>{course.course_name}</span></h2>
                  <p>Course Code : <span className='capitalize'>{course.course_code}</span></p>
                  <p>Section : <span className='capitalize'>{course.section}</span></p>
                  <p>Type : <span className='capitalize'>{course.examType}</span></p>
                  <p>Semester : <span className='capitalize'>{course.semister == 1 ? 'First Semester' : 'Second Semester'}</span></p>
                </div>

              </Link>
            )

        }
      </main>

    </>
  )
}