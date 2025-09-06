import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { Course, Assessment } from '@/lib/models';
import { generateCloReportHTML } from '@/templates/cloReport';

// Function to process assessment data and return student performance analysis
function processStudentPerformanceAnalysis(assessmentData: AssessmentData) {
  // Get unique exam types
  const uniqueExamTypes = new Set<string>();
  assessmentData.assessmentResults.forEach(result => {
    uniqueExamTypes.add(result.type);
  });

  // Calculate statistics for each exam type
  const examMetadata: { [examType: string]: { mean: number; stdDev: number } } = {};
  const examResults: { [examType: string]: any[] } = {};

  uniqueExamTypes.forEach(examType => {
    const examData = assessmentData.assessmentResults.find(result => result.type === examType);
    if (examData && examData.results.length > 0) {
      // Calculate scores out of 100 for each student
      const studentScores = examData.results.map(student => {
        const scoreOutOf100 = (student.totalScore.marksScored / student.totalScore.totalMarks) * 100;
        return {
          studentId: student.studentId,
          studentName: student.studentName,
          marksScored: student.totalScore.marksScored,
          totalMarks: student.totalScore.totalMarks,
          scoreOutOf100: scoreOutOf100
        };
      });

      // Calculate mean and standard deviation
      const scores = studentScores.map(s => s.scoreOutOf100);
      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);

      // Store metadata
      examMetadata[examType] = { mean, stdDev: standardDeviation };

      // Calculate Z-scores and performance levels for each student
      const studentScoresWithZ = studentScores.map(student => {
        const zScore = (student.scoreOutOf100 - mean) / standardDeviation;
        let performance = '';
        if (zScore < 0) {
          performance = 'Low';
        } else if (zScore >= 0 && zScore <= 1) {
          performance = 'Average';
        } else if (zScore > 1) {
          performance = 'High';
        }

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          scoreOutOf100: student.scoreOutOf100,
          zScore: zScore,
          performance: performance
        };
      });

      examResults[examType] = studentScoresWithZ;
    }
  });

  // Get all unique students across all exams
  const allStudents = new Set<string>();
  Object.values(examResults).forEach(examStudents => {
    examStudents.forEach(student => {
      allStudents.add(student.studentId);
    });
  });

  // Build result structure
  const result = Array.from(allStudents).map((studentId, index) => {
    // Get student name from first exam result
    const firstExam = Object.values(examResults)[0];
    const studentInfo = firstExam.find(s => s.studentId === studentId);
    const studentName = studentInfo ? studentInfo.studentName : 'Unknown';

    // Build performance object for this student
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

    return {
      sNo: index + 1,
      studentId: studentId,
      studentName: studentName,
      performance: performance
    };
  });

  return {
    result: result,
    metadata: examMetadata
  };
}

interface CourseData {
  course_name: string;
  level: number;
  semister: number;
  academic_year: string;
  section: string;
  department: string;
  course_code: string;
  credit_hours: string;
  coordinator: {
    name: string;
  };
  collage: {
    logo: string;
    english: string;
    regional: string;
    university: string;
  };
}

interface AssessmentData {
  assessments: Array<{
    type: string;
    clos: {
      [cloId: string]: number[];  // Array of question numbers for this CLO
    };
    weight: number;
  }>;
  students: Array<{
    studentId: string;
    studentName: string;
  }>;
  assessmentResults: Array<{
    type: string;
    mode: string;
    results: Array<{
      studentId: string;
      studentName: string;
      totalScore: {
        correct: number;
        total: number;
        percentage: number;
        marksScored: number;
        totalMarks: number;
      };
      cloResults: {
        [cloId: string]: {
          totalQuestions: number;
          correctAnswers: number;
          marksScored: number;
          totalMarks: number;
        };
      };
    }>;
    questionKeys: Array<{
      questionNumber: string;
      correctAnswer: string;
    }>;
  }>;
  indirectAssessments?: Array<{
    clo: string;
    achievementRate: number;
    benchmark: string;
    achievementPercentage: number;
  }>;
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    
    const body = await request.json();
    const { courseId, academicYear, coordinator } = body;

    if (!courseId || !academicYear) {
      return NextResponse.json({
        message: 'Course ID and Academic Year are required',
        status: 'error'
      }, { status: 400 });
    }

    // Get course data with college info
    const courseData = await Course.findOne({
      _id: courseId,
      academic_year: academicYear
    })
    .populate(['collage'])
    .select('course_name level semister department course_code credit_hours collage academic_year section')
    .lean() as unknown as CourseData;

    if (!courseData) {
      return NextResponse.json({
        message: 'Course not found',
        status: 'error'
      }, { status: 404 });
    }

    // Get assessment data
    const assessmentData = await Assessment.findOne({ course: courseId }).lean() as unknown as AssessmentData;
    
    if (!assessmentData) {
      return NextResponse.json({
        message: 'Assessment data not found',
        status: 'error'
      }, { status: 404 });
    }

    // NEW APPROACH: Calculate CLO scores directly from assessmentResults
    const uniqueClos = new Set<string>();
    const cloTotalMarks = new Map<string, number>();
    const studentResults = new Map<string, {
      studentId: string;
      studentName: string;
      cloScores: {[key: string]: {marksScored: number; totalMarks: number}};
      totalMarksObtained: number;
    }>();

    // First pass: collect all unique CLOs and calculate total marks for each CLO
    // The totalMarks for each CLO should be the sum across all assessment types
    assessmentData.assessmentResults.forEach(assessmentResult => {
      if (assessmentResult.results.length > 0) {
        const firstStudentResult = assessmentResult.results[0];
        Object.entries(firstStudentResult.cloResults).forEach(([cloId, cloResult]) => {
          uniqueClos.add(cloId);
          
          // Add the totalMarks from this assessment type to the CLO total
          const currentTotal = cloTotalMarks.get(cloId) || 0;
          cloTotalMarks.set(cloId, currentTotal + cloResult.totalMarks);
        });
      }
    });

    // Second pass: process student results and accumulate scores
    assessmentData.assessmentResults.forEach(assessmentResult => {
      assessmentResult.results.forEach(studentResult => {
        // Use the field that's actually a numeric ID
        const actualStudentId = /^\d+$/.test(studentResult.studentId) ? 
          studentResult.studentId : studentResult.studentName;
        
        let student = studentResults.get(actualStudentId);
        
        // If this is the first time seeing this student, create their entry
        if (!student) {
          student = {
            studentId: actualStudentId,
            studentName: /^\d+$/.test(studentResult.studentId) ? 
              studentResult.studentName : studentResult.studentId,
            cloScores: {},
            totalMarksObtained: 0
          };
          studentResults.set(actualStudentId, student);
        }

        // Initialize CLO scores for this student if not exists
        Object.keys(studentResult.cloResults).forEach(cloId => {
          if (!student.cloScores[cloId]) {
            student.cloScores[cloId] = {
              marksScored: 0,
              totalMarks: 0
            };
          }
        });

        // Accumulate scores from this assessment for each CLO
        Object.entries(studentResult.cloResults).forEach(([cloId, cloResult]) => {
          student.cloScores[cloId].marksScored += cloResult.marksScored;
          student.cloScores[cloId].totalMarks += cloResult.totalMarks;
        });
      });
    });

    // Calculate total marks obtained for each student
    studentResults.forEach(student => {
      student.totalMarksObtained = Object.values(student.cloScores)
        .reduce((sum, score) => sum + score.marksScored, 0);
    });

    // Prepare data for template with all calculations
    const processedData = {
      students: Array.from(studentResults.values()),
      cloScores: Object.fromEntries(cloTotalMarks),
      achievementData: {
        60: Array.from(uniqueClos).map(clo => {
          const totalScore = cloTotalMarks.get(clo) || 0;
          const studentsAchieving = Array.from(studentResults.values()).filter(student => {
            const studentScore = student.cloScores[clo]?.marksScored || 0;
            const percentage = (studentScore / totalScore) * 100;
            return percentage >= 60;
          });
          return {
            clo,
            achievementGrade: (totalScore * 0.6).toFixed(2),
            percentageAchieving: ((studentsAchieving.length / studentResults.size) * 100).toFixed(2)
          };
        }),
        70: Array.from(uniqueClos).map(clo => {
          const totalScore = cloTotalMarks.get(clo) || 0;
          const studentsAchieving = Array.from(studentResults.values()).filter(student => {
            const studentScore = student.cloScores[clo]?.marksScored || 0;
            const percentage = (studentScore / totalScore) * 100;
            return percentage >= 70;
          });
          return {
            clo,
            achievementGrade: (totalScore * 0.7).toFixed(2),
            percentageAchieving: ((studentsAchieving.length / studentResults.size) * 100).toFixed(2)
          };
        }),
        80: Array.from(uniqueClos).map(clo => {
          const totalScore = cloTotalMarks.get(clo) || 0;
          const studentsAchieving = Array.from(studentResults.values()).filter(student => {
            const studentScore = student.cloScores[clo]?.marksScored || 0;
            const percentage = (studentScore / totalScore) * 100;
            return percentage >= 80;
          });
          return {
            clo,
            achievementGrade: (totalScore * 0.8).toFixed(2),
            percentageAchieving: ((studentsAchieving.length / studentResults.size) * 100).toFixed(2)
          };
        }),
        90: Array.from(uniqueClos).map(clo => {
          const totalScore = cloTotalMarks.get(clo) || 0;
          const studentsAchieving = Array.from(studentResults.values()).filter(student => {
            const studentScore = student.cloScores[clo]?.marksScored || 0;
            const percentage = (studentScore / totalScore) * 100;
            return percentage >= 90;
          });
          return {
            clo,
            achievementGrade: (totalScore * 0.9).toFixed(2),
            percentageAchieving: ((studentsAchieving.length / studentResults.size) * 100).toFixed(2)
          };
        })
      },
      sortedClos: Array.from(uniqueClos).sort((a, b) => {
        const aNum = parseInt(a.replace(/[^\d]/g, ''));
        const bNum = parseInt(b.replace(/[^\d]/g, ''));
        return aNum - bNum;
      })
    };

    // Save achievement data to MongoDB
    try {
      await Assessment.findOneAndUpdate(
        { course: courseId },
        { $set: { achievementData: processedData.achievementData } },
        { new: true }
      );
    } catch (error) {
      console.error('Failed to save achievement data:', error);
      // Continue with response even if save fails
    }

    // Process student performance analysis
    const performanceAnalysis = processStudentPerformanceAnalysis(assessmentData);
    
    console.log('=== STUDENT PERFORMANCE ANALYSIS ===');
    console.log(JSON.stringify(performanceAnalysis, null, 2));
    console.log('=== END ANALYSIS ===\n');

    // Generate HTML content using the template
    const htmlContent = await generateCloReportHTML({
      course: {
        course_name: courseData.course_name,
        level: courseData.level,
        section: courseData?.section,
        academic_year: courseData?.academic_year,
        semister: courseData.semister,
        department: courseData.department,
        course_code: courseData.course_code,
        credit_hours: courseData.credit_hours,
        coordinator: coordinator
      },
      college: courseData.collage,
      assessmentData: processedData,
      indirectAssessmentData: assessmentData?.indirectAssessments ? {
        indirectAssessments: assessmentData.indirectAssessments
      } : undefined
    });

    // Return the HTML content
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating CLO report:', error);
    return NextResponse.json({
      message: 'Error generating CLO report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
