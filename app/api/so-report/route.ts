import { connectToMongoDB } from "@/lib/db";
import { Assessment, Course } from "@/lib/models";
import { NextResponse } from "next/server";
import { IAssessment } from "@/server/models/assessment.model";
import { generateSOHTML } from "@/templates/so-report";
import { analyzeReport } from "../../../ai/analyze-report";

// Function to process assessment data and return student performance analysis
function processStudentPerformanceAnalysis(assessmentData: IAssessment) {
  const uniqueExamTypes = new Set<string>();
  assessmentData.assessmentResults.forEach(result => uniqueExamTypes.add(result.type));

  const examMetadata: { [examType: string]: { mean: number; stdDev: number } } = {};
  const examResults: { [examType: string]: any[] } = {};
  const studentAverages: { [studentId: string]: number[] } = {};

  // Process each exam type
  uniqueExamTypes.forEach(examType => {
    const examData = assessmentData.assessmentResults.find(result => result.type === examType);
    if (!examData?.results.length) return;

    // Calculate scores and statistics
    const studentScores = examData.results.map(student => {
      const scoreOutOf100 = (student.totalScore.marksScored / student.totalScore.totalMarks) * 100;
      return { studentId: student.studentId, studentName: student.studentName, scoreOutOf100 };
    });

    const scores = studentScores.map(s => s.scoreOutOf100);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    examMetadata[examType] = { mean, stdDev: standardDeviation };

    // Calculate Z-scores and performance
    const studentScoresWithZ = studentScores.map(student => {
      const zScore = (student.scoreOutOf100 - mean) / standardDeviation;
      const performance = zScore < 0 ? 'Low' : zScore <= 1 ? 'Average' : 'High';

      // Collect averages for overall calculation
      if (!studentAverages[student.studentId]) studentAverages[student.studentId] = [];
      studentAverages[student.studentId].push(student.scoreOutOf100);

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        scoreOutOf100: student.scoreOutOf100,
        zScore,
        performance
      };
    });

    examResults[examType] = studentScoresWithZ;
  });

  // Calculate overall statistics
  const allStudentAverages = Object.values(studentAverages).map(scores => 
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );
  const overallMean = allStudentAverages.reduce((sum, avg) => sum + avg, 0) / allStudentAverages.length;
  const overallVariance = allStudentAverages.reduce((sum, avg) => sum + Math.pow(avg - overallMean, 2), 0) / allStudentAverages.length;
  const overallStdDev = Math.sqrt(overallVariance);

  // Build result structure
  const allStudents = new Set<string>();
  Object.values(examResults).forEach(examStudents => {
    examStudents.forEach(student => allStudents.add(student.studentId));
  });

  const result = Array.from(allStudents).map((studentId, index) => {
    const firstExam = Object.values(examResults)[0];
    const studentInfo = firstExam.find(s => s.studentId === studentId);
    const studentName = studentInfo?.studentName || 'Unknown';

    // Build performance object
    const performance: { [examType: string]: { scoreOutOf100: number; zScore: number; performance: string } } = {};
    
    Object.keys(examResults).forEach(examType => {
      const studentResult = examResults[examType].find(s => s.studentId === studentId);
      if (studentResult) {
        performance[examType] = {
          scoreOutOf100: studentResult.scoreOutOf100,
          zScore: studentResult.zScore,
          performance: studentResult.performance
        };
      }
    });

    // Add overall performance
    const studentAverage = studentAverages[studentId]?.reduce((sum, score) => sum + score, 0) / studentAverages[studentId].length || 0;
    const overallZScore = (studentAverage - overallMean) / overallStdDev;
    const overallPerformance = overallZScore < 0 ? 'Low' : overallZScore <= 1 ? 'Average' : 'High';

    performance.Overall = {
      scoreOutOf100: studentAverage,
      zScore: overallZScore,
      performance: overallPerformance
    };

    return {
      sNo: index + 1,
      studentId,
      studentName,
      performance
    };
  });

  return {
    result,
    metadata: examMetadata,
    overall: { mean: overallMean, stdDev: overallStdDev }
  };
}

interface CourseData {
  course_name: string;
  level: number;
  academic_year: string;
  section: string;
  semister: number;
  department: string;
  course_code: string;
  credit_hours: string;
  collage: {
    logo: string;
    english: string;
    regional: string;
    university: string;
  };
}

interface GradeCount {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D+': number;
    'D': number;
    'F': number;
}

export const dynamic = 'force-dynamic';

// Normal distribution function (equivalent to NORM.DIST in Excel)
function normalDistribution(x: number, mean: number, stdDev: number): number {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return coefficient * Math.exp(exponent);
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

    // Count students in each range
    const rangeCounts = ranges.map(range => {
        let count = 0;
        overallScores.forEach((scores) => {
            const percentage = (scores.scored / scores.total) * 100;
            if (percentage >= range.min && percentage < range.max) {
                count++;
            }
        });
        return { ...range, count };
    });

    // Calculate statistics for summary
    const percentages = Array.from(overallScores.values()).map(scores => (scores.scored / scores.total) * 100);
    const mean = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const sorted = percentages.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...percentages);
    const max = Math.max(...percentages);

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

export async function GET(request: Request) {
    try {
        await connectToMongoDB();
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const academicYear = searchParams.get('academicYear');
        const coordinator = searchParams.get('coordinator');
        if (!courseId) {
            return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
        }
        const courseData = await Course.findOne({
            _id: courseId,
            academic_year: academicYear
          })
          .populate('collage')
          .select('course_name level semister department course_code credit_hours collage section academic_year')
          .lean() as unknown as CourseData;
      
          if (!courseData) {
            return NextResponse.json({
              message: 'Course not found',
              status: 'error'
            }, { status: 404 });
          }
      

        const assessment = await Assessment.findOne({ course: courseId })
            .select('assessmentResults')
            .lean() as unknown as IAssessment;

        if (!assessment) {
            return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
        }

        // Prepare data for HTML generation
        const assessmentData: Record<string, GradeCount> = {};

        // For individual assessment grades - keep as is
        assessment.assessmentResults.forEach((result) => {
            const { type, results } = result;
            assessmentData[type] = {
                'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
            };

            results.forEach((student) => {
                const percentage = (student.totalScore.marksScored / student.totalScore.totalMarks) * 100;
                
                if (percentage >= 95) assessmentData[type]['A+']++;
                else if (percentage >= 90) assessmentData[type]['A']++;
                else if (percentage >= 85) assessmentData[type]['B+']++;
                else if (percentage >= 80) assessmentData[type]['B']++;
                else if (percentage >= 75) assessmentData[type]['C+']++;
                else if (percentage >= 70) assessmentData[type]['C']++;
                else if (percentage >= 65) assessmentData[type]['D+']++;
                else if (percentage >= 60) assessmentData[type]['D']++;
                else assessmentData[type]['F']++;
            });
        });

        // For overall grades - track by studentId only, but validate it's a number
        const overallScores = new Map<string, { scored: number, total: number }>();

        assessment.assessmentResults.forEach(result => {
            result.results.forEach(({ studentId, studentName, totalScore }) => {
                // Use the field that's actually a numeric ID
                const actualStudentId = /^\d+$/.test(studentId) ? studentId : studentName;
                
                const current = overallScores.get(actualStudentId) || { scored: 0, total: 0 };
                overallScores.set(actualStudentId, {
                    scored: current.scored + totalScore.marksScored,
                    total: current.total + totalScore.totalMarks
                });
            });
        });

        // console.log("Student Scores:", Array.from(overallScores.entries()).map(([id, scores]) => ({
        //     studentId: id,
        //     totalScored: scores.scored,
        //     totalPossible: scores.total,
        //     percentage: ((scores.scored / scores.total) * 100).toFixed(2) + '%'
        // })));

        // Calculate overall grade distribution
        const overallStudentGrades = {
            'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
        };

        overallScores.forEach((scores) => {
            const percentage = (scores.scored / scores.total) * 100;
          
            
            if (percentage >= 95) overallStudentGrades['A+']++;
            else if (percentage >= 90) overallStudentGrades['A']++;
            else if (percentage >= 85) overallStudentGrades['B+']++;
            else if (percentage >= 80) overallStudentGrades['B']++;
            else if (percentage >= 75) overallStudentGrades['C+']++;
            else if (percentage >= 70) overallStudentGrades['C']++;
            else if (percentage >= 65) overallStudentGrades['D+']++;
            else if (percentage >= 60) overallStudentGrades['D']++;
            else overallStudentGrades['F']++;
        });

        // Process student performance analysis
        const performanceAnalysis = processStudentPerformanceAnalysis(assessment);
        
        // Calculate performance curve data
        const performanceCurveData = calculatePerformanceCurve(overallScores);
        
        // Add AI analysis for SO report
        try {
            console.log('🤖 Starting AI analysis for SO report...');
            
            // Generate proper bell curve data (same as in template)
            const mean = performanceAnalysis.overall.mean;
            const stdDev = performanceAnalysis.overall.stdDev;
            
            // Generate normal distribution data points (60-100 range, step 1)
            const normalDistributionData = [];
            for (let x = 60; x <= 100; x++) {
                const value = normalDistribution(x, mean, stdDev) * 97; // Same formula as template
                normalDistributionData.push({ x, value });
            }
            
            // Prepare chart-focused data for AI analysis
            const soAnalysisData = {
                histogram: {
                    scoreRanges: performanceCurveData.ranges,
                    totalStudents: performanceCurveData.statistics.totalStudents,
                    mean: parseFloat(performanceCurveData.statistics.mean),
                    median: parseFloat(performanceCurveData.statistics.median),
                    min: parseFloat(performanceCurveData.statistics.min),
                    max: parseFloat(performanceCurveData.statistics.max)
                },
                bellCurve: {
                    distribution: "normal",
                    mean: mean,
                    standardDeviation: stdDev,
                    skewness: "slightly_left_skewed",
                    dataPoints: normalDistributionData // The actual bell curve data points
                }
            };
            
            const aiAnalysis = await analyzeReport('so-report', soAnalysisData);
            console.log('✅ SO Report AI Analysis Result:', JSON.stringify(aiAnalysis, null, 2));
        } catch (error) {
            console.error('❌ SO Report AI Analysis Error:', error);
        }
        
        // console.log('=== STUDENT PERFORMANCE ANALYSIS ===');
        // console.log(JSON.stringify(performanceAnalysis, null, 2));
        // console.log('=== END ANALYSIS ===\n');

        // Await the HTML generation
        const htmlContent = await generateSOHTML({
            assessmentData,
            overallGrades: overallStudentGrades,
            course: {
                course_name: courseData.course_name,
                level: courseData.level,
                section: courseData?.section,
                semister: courseData.semister,
                department: courseData.department,
                academic_year:courseData?.academic_year,
                course_code: courseData.course_code,
                credit_hours: courseData.credit_hours,
                coordinator: coordinator!
              },
              college: courseData.collage,
              performanceAnalysis: performanceAnalysis,
              performanceCurveData: performanceCurveData
        });

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } catch (error) {
        console.error('Error generating assessment report:', error);
        return NextResponse.json({
            message: 'Error generating assessment report',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
