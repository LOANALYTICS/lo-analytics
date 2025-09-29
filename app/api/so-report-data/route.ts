// SO Report Data Calculation API - Step 1
import { connectToMongoDB } from "@/lib/db";
import { Assessment, Course } from "@/lib/models";
import { NextResponse } from "next/server";
import { IAssessment } from "@/server/models/assessment.model";

import { GradeCount, CourseData, getGrade, initializeGradeCount } from "@/lib/utils/so-report-utils";

// Optimized function to process assessment data and return student performance analysis
function processStudentPerformanceAnalysis(assessmentData: IAssessment) {
  const examMetadata: { [examType: string]: { mean: number; stdDev: number } } = {};
  const examResults: { [examType: string]: any[] } = {};
  const studentAverages: { [studentId: string]: number[] } = {};

  // Single pass through assessment results
  assessmentData.assessmentResults.forEach(result => {
    const { type: examType, results } = result;
    if (!results.length) return;

    // Pre-calculate all scores and statistics in one pass
    const studentScores: Array<{ studentId: string; studentName: string; scoreOutOf100: number }> = [];
    let sum = 0;
    
    results.forEach(student => {
      const scoreOutOf100 = (student.totalScore.marksScored / student.totalScore.totalMarks) * 100;
      studentScores.push({ 
        studentId: student.studentId, 
        studentName: student.studentName, 
        scoreOutOf100 
      });
      sum += scoreOutOf100;
      
      // Collect averages for overall calculation
      if (!studentAverages[student.studentId]) studentAverages[student.studentId] = [];
      studentAverages[student.studentId].push(scoreOutOf100);
    });

    const mean = sum / results.length;
    
    // Calculate variance in single pass
    let varianceSum = 0;
    studentScores.forEach(s => {
      varianceSum += Math.pow(s.scoreOutOf100 - mean, 2);
    });
    const standardDeviation = Math.sqrt(varianceSum / results.length);

    examMetadata[examType] = { mean, stdDev: standardDeviation };

    // Calculate Z-scores and performance in single pass
    examResults[examType] = studentScores.map(student => {
      const zScore = (student.scoreOutOf100 - mean) / standardDeviation;
      const performance = zScore < -1 ? 'Low' : zScore <= 1 ? 'Average' : 'High';

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        scoreOutOf100: student.scoreOutOf100,
        zScore,
        performance
      };
    });
  });

  // Calculate overall statistics efficiently
  const allStudentAverages = Object.values(studentAverages).map(scores => 
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );
  const overallMean = allStudentAverages.reduce((sum, avg) => sum + avg, 0) / allStudentAverages.length;
  const overallVariance = allStudentAverages.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / allStudentAverages.length;
  const overallStdDev = Math.sqrt(overallVariance);

  // Build result structure efficiently using Map for O(1) lookups
  const studentMap = new Map<string, { studentName: string; performance: any }>();
  
  Object.entries(examResults).forEach(([examType, students]) => {
    students.forEach(student => {
      if (!studentMap.has(student.studentId)) {
        studentMap.set(student.studentId, {
          studentName: student.studentName,
          performance: {}
        });
      }
      
      const studentData = studentMap.get(student.studentId)!;
      studentData.performance[examType] = {
        scoreOutOf100: student.scoreOutOf100,
        zScore: student.zScore,
        performance: student.performance
      };
    });
  });

  // Add overall performance and build final result
  const result = Array.from(studentMap.entries()).map(([studentId, data], index) => {
    const studentAverage = studentAverages[studentId]?.reduce((sum, score) => sum + score, 0) / studentAverages[studentId].length || 0;
    const overallZScore = (studentAverage - overallMean) / overallStdDev;
    const overallPerformance = overallZScore < -1 ? 'Low' : overallZScore <= 1 ? 'Average' : 'High';

    data.performance.Overall = {
      scoreOutOf100: studentAverage,
      zScore: overallZScore,
      performance: overallPerformance
    };

    return {
      sNo: index + 1,
      studentId,
      studentName: data.studentName,
      performance: data.performance
    };
  });

  return {
    result,
    metadata: examMetadata,
    overall: { mean: overallMean, stdDev: overallStdDev }
  };
}

function calculatePerformanceCurve(overallScores: Map<string, { scored: number, total: number }>) {
    // Define score ranges
    const ranges = [
        { min: 0, max: 60, label: '0-60' },
        { min: 60, max: 65, label: '60-65' },
        { min: 65, max: 70, label: '65-70' },
        { min: 70, max: 75, label: '70-75' },
        { min: 75, max: 80, label: '75-80' },
        { min: 80, max: 85, label: '80-85' },
        { min: 85, max: 90, label: '85-90' },
        { min: 90, max: 95, label: '90-95' },
        { min: 95, max: 100, label: '95-100' }
    ];

    // Initialize range counts
    const rangeCounts = ranges.map(range => ({ ...range, count: 0 }));
    
    // Calculate percentages and statistics in single pass
    const percentages: number[] = [];
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    overallScores.forEach((scores) => {
        const percentage = (scores.scored / scores.total) * 100;
        percentages.push(percentage);
        sum += percentage;
        
        if (percentage < min) min = percentage;
        if (percentage > max) max = percentage;

        // Count in appropriate range
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const isLastRange = i === ranges.length - 1;
            if (percentage >= range.min && (isLastRange ? percentage <= range.max : percentage < range.max)) {
                rangeCounts[i].count++;
                break;
            }
        }
    });

    const mean = sum / percentages.length;
    
    // Calculate median efficiently
    percentages.sort((a, b) => a - b);
    const median = percentages.length % 2 === 0 
        ? (percentages[percentages.length / 2 - 1] + percentages[percentages.length / 2]) / 2
        : percentages[Math.floor(percentages.length / 2)];

    return {
        ranges: rangeCounts,
        statistics: {
            mean: mean.toFixed(1),
            median: median.toFixed(1),
            min: min.toFixed(1),
            max: max.toFixed(1),
            totalStudents: percentages.length
        }
    };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await connectToMongoDB();
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const academicYear = searchParams.get('academicYear');
        
        if (!courseId) {
            return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
        }

        // Fetch both course and assessment data in parallel
        const [courseData, assessment] = await Promise.all([
            Course.findOne({
                _id: courseId,
                academic_year: academicYear
            })
            .populate('collage')
            .select('course_name level semister department course_code credit_hours collage section academic_year')
            .lean(),
            
            Assessment.findOne({ course: courseId })
            .select('assessmentResults')
            .lean()
        ]) as [CourseData | null, IAssessment | null];
      
        if (!courseData) {
            return NextResponse.json({
              message: 'Course not found',
              status: 'error'
            }, { status: 404 });
        }

        if (!assessment) {
            return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
        }



        // Process assessment data
        const assessmentData: Record<string, GradeCount> = {};
        const overallScores = new Map<string, { scored: number, total: number }>();
        
        // Single pass through all assessment results
        assessment.assessmentResults.forEach((result) => {
            const { type, results } = result;
            
            // Initialize grade counts for this assessment type
            assessmentData[type] = initializeGradeCount();

            results.forEach((student) => {
                const percentage = (student.totalScore.marksScored / student.totalScore.totalMarks) * 100;
                const grade = getGrade(percentage);
                
                // Count grade for this assessment type
                assessmentData[type][grade]++;
                
                // Accumulate overall scores
                const actualStudentId = /^\d+$/.test(student.studentId) ? student.studentId : student.studentName;
                const current = overallScores.get(actualStudentId) || { scored: 0, total: 0 };
                overallScores.set(actualStudentId, {
                    scored: current.scored + student.totalScore.marksScored,
                    total: current.total + student.totalScore.totalMarks
                });
            });
        });

        // Calculate overall grade distribution
        const overallStudentGrades: GradeCount = initializeGradeCount();

        overallScores.forEach((scores) => {
            const percentage = (scores.scored / scores.total) * 100;
            const grade = getGrade(percentage);
            overallStudentGrades[grade]++;
        });

        // Process data in parallel
        const [performanceAnalysis, performanceCurveData] = await Promise.all([
            Promise.resolve(processStudentPerformanceAnalysis(assessment)),
            Promise.resolve(calculatePerformanceCurve(overallScores))
        ]);

        return NextResponse.json({
            assessmentData,
            overallGrades: overallStudentGrades,
            course: {
                course_name: courseData.course_name,
                level: courseData.level,
                section: courseData?.section,
                semister: courseData.semister,
                department: courseData.department,
                academic_year: courseData?.academic_year,
                course_code: courseData.course_code,
                credit_hours: courseData.credit_hours
            },
            college: courseData.collage,
            performanceAnalysis,
            performanceCurveData
        });

    } catch (error) {
        console.error('Error calculating SO report data:', error);
        return NextResponse.json({
            message: 'Error calculating SO report data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}