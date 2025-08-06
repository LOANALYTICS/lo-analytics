import { NextRequest, NextResponse } from 'next/server';
import { Course, Assessment } from '@/lib/models';
import { connectToMongoDB } from '@/lib/db';
import { generateAssessmentReportExcel } from '@/lib/utils/excel-generator';

interface CourseData {
  _id: string;
  course_name: string;
  course_code: string;
}

interface AssessmentData {
  assessments: Array<{
    type: string;
    clos: {
      [cloId: string]: number[];
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
  cloData: Array<{
    clo: string;
    description: string;
    ploMapping: {
      k: Array<{ [key: string]: boolean }>;
      s: Array<{ [key: string]: boolean }>;
      v: Array<{ [key: string]: boolean }>;
    };
  }>;
  achievementData?: {
    [key: string]: Array<{
      clo: string;
      achievementGrade: number;
      percentageAchieving: number;
    }>;
  };
  indirectAssessments?: Array<{
    clo: string;
    achievementRate: number;
    benchmark: string;
    achievementPercentage: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB();

    const body = await request.json();
    const { academic_year, semester, section } = body;

    // Console log the received form data

    // Build the filter query
    let filterQuery: any = {
      semister: semester,
      academic_year: academic_year,
      examType: "final"
    };

    // Handle section filtering
    if (section === 'all') {
      filterQuery.section = { $in: ['male', 'female'] };
    } else {
      filterQuery.section = section;
    }

    // Get courses with level data
    const courses = await Course.find(filterQuery)
      .select('course_name course_code _id level')
      .lean() as unknown as (CourseData & { level: number })[];


    // Get assessment data for each course
    const coursesWithAssessments = await Promise.all(
      courses.map(async (course) => {
        const assessment = await Assessment.findOne({ course: course._id })
          .select('cloData achievementData indirectAssessments assessments students assessmentResults')
          .lean() as unknown as AssessmentData | null;

        if (!assessment) {
          return {
            course: {
              course_name: course.course_name,
              course_code: course.course_code,
              level: course.level || 12
            },
            assessment: null,
            achievementData: [],
            indirectData: []
          };
        }

        // Calculate achievement data if not already present
        let achievementData = assessment.achievementData;

        if (!achievementData && assessment.assessments && assessment.assessmentResults) {
          // Get unique CLOs and calculate total marks
          const uniqueClos = new Set<string>();
          const cloTotalMarks = new Map<string, number>();

          assessment.assessments.forEach(assessmentItem => {
            if (assessmentItem.clos) {
              const totalQuestionsInType = Object.values(assessmentItem.clos)
                .reduce((sum, questions) => sum + questions.length, 0);
              const marksPerQuestion = assessmentItem.weight / totalQuestionsInType;

              Object.entries(assessmentItem.clos).forEach(([clo, questions]) => {
                uniqueClos.add(clo);
                const marksForThisCLO = questions.length * marksPerQuestion;
                cloTotalMarks.set(clo, (cloTotalMarks.get(clo) || 0) + marksForThisCLO);
              });
            }
          });

          // Process student results
          const studentResults = new Map<string, {
            studentId: string;
            studentName: string;
            cloScores: { [key: string]: { marksScored: number; totalMarks: number } };
          }>();

          assessment.assessmentResults.forEach(result => {
            result.results.forEach(studentResult => {
              const actualStudentId = /^\d+$/.test(studentResult.studentId) ?
                studentResult.studentId : studentResult.studentName;

              let student = studentResults.get(actualStudentId);

              if (!student) {
                student = {
                  studentId: actualStudentId,
                  studentName: /^\d+$/.test(studentResult.studentId) ?
                    studentResult.studentName : studentResult.studentId,
                  cloScores: {}
                };
                studentResults.set(actualStudentId, student);
              }

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

          // Calculate achievement data for 60% threshold
          achievementData = {
            60: Array.from(uniqueClos).map(clo => {
              const totalScore = cloTotalMarks.get(clo) || 0;
              const studentsAchieving = Array.from(studentResults.values()).filter(student => {
                const studentScore = student.cloScores[clo]?.marksScored || 0;
                const percentage = (studentScore / totalScore) * 100;
                return percentage >= 60;
              });
              return {
                clo,
                achievementGrade: (totalScore * 0.6),
                percentageAchieving: ((studentsAchieving.length / studentResults.size) * 100)
              };
            })
          };
        }

        const courseData = {
          course: {
            course_name: course.course_name,
            course_code: course.course_code,
            level: course.level || 12
          },
          assessment: assessment ? {
            cloData: assessment.cloData
          } : null,
          achievementData: achievementData?.['60'] || [],
          indirectData: assessment.indirectAssessments || []
        };


        return courseData;
      })
    );


    // Generate Excel file using utility function
    const excelBuffer = await generateAssessmentReportExcel(
      coursesWithAssessments,
      academic_year,
      semester,
      section
    );

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="semester-assessment-report-${academic_year}-sem${semester}-${section}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error processing assessment report request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}