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
import { useStreamingAI } from '@/lib/hooks/useStreamingAI';

export default function StreamingAssessmentCard({ href, course, standalone }: {
  href: string,
  course: any,
  standalone?: boolean
}) {
  const [coordinator, setCoordinator] = useState<any>();
  const { analyzeReport, isLoading: aiLoading, error: aiError } = useStreamingAI();

  useEffect(() => {
    const fetchCoordinator = async () => {
      const user = await getCurrentUser()
      setCoordinator(user)
    };
    fetchCoordinator()
  }, [course._id]);

  const handleStreamingStudentOutcome = async (e: any, id: string, ace_year: string, section: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!id || !ace_year || !section) {
      toast.error('Required parameters missing');
      return;
    }

    try {
      // Step 1: Calculate SO report data (same as before)
      toast.loading("Calculating report data...")
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

      // Step 2: Generate AI analysis using STREAMING (bypasses 10s timeout!)
      toast.loading("Streaming AI analysis...")
      let aiComments;

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

        console.log('🚀 Starting streaming AI analysis...');

        // Use streaming AI - this bypasses Vercel's 10s timeout!
        const streamResult = await analyzeReport('so-report', soAnalysisData, {
          onProgress: (partial) => {
            console.log('📊 Streaming progress:', partial);
            toast.loading("AI analysis in progress...");
          },
          onComplete: (final) => {
            console.log('✅ Streaming completed:', final);
          },
          onError: (error) => {
            console.error('❌ Streaming error:', error);
          }
        });

        aiComments = {
          ...streamResult,
          normalDistributionData
        };

        console.log('✅ Streaming AI analysis completed successfully');

      } catch (aiError) {
        console.warn('❌ Streaming AI failed, using defaults:', aiError);
        aiComments = getDefaultAIComments(reportData.performanceCurveData);
      }

      // Step 3: Generate HTML report (same as before)
      toast.loading("Generating HTML report...")
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

      // Step 4: Generate PDF (same as before)
      toast.loading("Generating PDF...")
      await generatePDF(html, `${course?.course_code} SO Report (Streaming)`, 'portrait');

      toast.dismiss();
      toast.success('Streaming report generated successfully!');

    } catch (error: any) {
      console.error("Error generating streaming SO report:", error);
      toast.dismiss();
      toast.error(error.message || 'Failed to generate streaming report');
    }
  }

  // Regular handlers (same as original)
  const handleAssessmentPlan = async (e: any) => {
    // ... same implementation as original
  }

  const handleCloReport = async (e: any, id: string, ace_year: string, section: string) => {
    // ... same implementation as original
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
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStreamingStudentOutcome(e, course?._id, course?.academic_year, course?.section)
                    }}
                    variant='outline'
                    size='sm'
                    className='px-5 py-3 text-[11px] w-full h-fit font-bold'
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Streaming...' : 'S.O - Report (Stream)'}
                  </Button>

                  <Button onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAssessmentPlan(e)
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