import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { Course, Assessment } from '@/lib/models';
import { generateAssessmentReportHTML } from '@/templates/assessmentReport';

interface CourseData {
  course_name: string;
  level: number;
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
    results: Array<{
      studentId: string;
      studentName: string;
      cloResults: {
        [cloId: string]: {
          totalQuestions: number;
          correctAnswers: number;
          marksScored: number;
          totalMarks: number;
        };
      };
    }>;
  }>;
}

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    
    const body = await request.json();
    const { courseId, academicYear } = body;

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
    .populate('collage')
    .select('course_name level semister department course_code credit_hours collage')
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

    // Get unique CLOs and calculate total marks
    const uniqueClos = new Set<string>();
    const cloTotalMarks = new Map<string, number>();

    // Calculate total marks for each CLO across all types
    assessmentData.assessments.forEach(assessment => {
      if (assessment.clos) {
        const totalQuestionsInType = Object.values(assessment.clos)
          .reduce((sum, questions) => sum + questions.length, 0);
        const marksPerQuestion = assessment.weight / totalQuestionsInType;

        Object.entries(assessment.clos).forEach(([clo, questions]) => {
          uniqueClos.add(clo);
          const marksForThisCLO = questions.length * marksPerQuestion;
          cloTotalMarks.set(clo, (cloTotalMarks.get(clo) || 0) + marksForThisCLO);
        });
      }
    });

    // Process student results - combine scores across all assessments
    const studentResults = new Map<string, {
      studentId: string;
      studentName: string;
      cloScores: {[key: string]: {marksScored: number; totalMarks: number}};
      totalMarksObtained: number;
    }>();

    // Process each assessment result directly
    assessmentData.assessmentResults.forEach(result => {
      result.results.forEach(studentResult => {
        let student = studentResults.get(studentResult.studentId);
        
        // If this is the first time seeing this student, create their entry
        if (!student) {
          student = {
            studentId: studentResult.studentId,
            studentName: studentResult.studentName,
            cloScores: {},
            totalMarksObtained: 0
          };
          studentResults.set(studentResult.studentId, student);
        }

        // Add scores from this assessment
        Object.entries(studentResult.cloResults).forEach(([cloId, result]) => {
          if (!student.cloScores[cloId]) {
            student.cloScores[cloId] = {
              marksScored: 0,
              totalMarks: cloTotalMarks.get(cloId) || 0
            };
          }
          student.cloScores[cloId].marksScored += result.marksScored;
        });
      });
    });

    // Calculate total marks obtained for each student
    studentResults.forEach(student => {
      student.totalMarksObtained = Object.values(student.cloScores)
        .reduce((sum, score) => sum + score.marksScored, 0);
    });

    // Prepare data for template
    const processedData = {
      students: Array.from(studentResults.values()),
      cloScores: Object.fromEntries(cloTotalMarks)
    };

    // Generate HTML content
    const htmlContent = generateAssessmentReportHTML({
      course: {
        course_name: courseData.course_name,
        level: courseData.level,
        semister: courseData.semister,
        department: courseData.department,
        course_code: courseData.course_code,
        credit_hours: courseData.credit_hours
      },
      college: courseData.collage,
      assessmentData: processedData
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