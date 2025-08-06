import { NextRequest, NextResponse } from 'next/server';
import { Course, Assessment } from '@/lib/models';
import { connectToMongoDB } from '@/lib/db';
import * as XLSX from 'xlsx';

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
              course_code: course.course_code
            },
            assessment: null,
            achievementData: null,
            indirectData: null
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


    // Debug: Log the actual data structure
    console.log('=== DEBUGGING COURSE DATA ===');
    coursesWithAssessments.forEach((courseData, index) => {
      console.log(`\nCourse ${index + 1}:`, courseData.course);
      if (courseData.assessment?.cloData) {
        console.log('CLOs:', courseData.assessment.cloData.map(c => c.clo));
      }
      if (courseData.achievementData) {
        console.log('Achievement:', courseData.achievementData.map(a => `${a.clo}: ${a.percentageAchieving}%`));
      }
      if (courseData.indirectData) {
        console.log('Indirect:', courseData.indirectData.map(i => `${i.clo}: ${i.achievementPercentage}%`));
      }
    });
    console.log('=== END DEBUG ===');

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();

    // Create the data array to match your image structure
    const excelData: any[][] = [];

    // Header rows
    excelData.push(['S No', 'Level', 'Course Name & Code', 'CLOs', 'CLO Achivement']);
    excelData.push(['', '', '', '', 'Direct', 'Indirect']);

    // Track row positions for merging
    const merges: XLSX.Range[] = [];
    let currentRow = 2; // Starting after headers

    // Data rows - each course gets multiple rows (one per CLO)
    coursesWithAssessments.forEach((courseData, courseIndex) => {
      if (!courseData.assessment?.cloData || courseData.assessment.cloData.length === 0) {
        // If no CLO data, add one row with empty CLO info
        excelData.push([
          courseIndex + 1,
          courseData.course.level || 12,
          `${courseData.course.course_name} ${courseData.course.course_code}`,
          'No CLO data',
          '',
          ''
        ]);
        currentRow++;
        return;
      }

      // Sort CLOs for this course
      const sortedCourseClos = courseData.assessment.cloData.sort((a, b) => {
        const aNum = parseInt(a.clo.replace(/[^\d]/g, ''));
        const bNum = parseInt(b.clo.replace(/[^\d]/g, ''));
        return aNum - bNum;
      });

      const startRow = currentRow;

      sortedCourseClos.forEach((cloData, cloIndex) => {
        // Create proper CLO name (CLO 1, CLO 2, etc.)
        const cloNumber = cloIndex + 1;
        const properCloName = `CLO ${cloNumber}`;

        // Find direct achievement using the proper CLO key format
        const directAchievementKey = `clo${cloNumber}`;
        const directAchievement = courseData.achievementData?.find(ach => ach.clo === directAchievementKey);
        let directValue = '';
        if (directAchievement) {
          const percentage = Number(directAchievement.percentageAchieving);
          directValue = isNaN(percentage) ? '0%' : `${Math.round(percentage)}%`;
        }

        // Find indirect achievement using proper CLO name format
        const indirectAchievement = courseData.indirectData?.find(indirect =>
          indirect.clo === properCloName || indirect.clo === `CLO ${cloNumber}`
        );
        let indirectValue = '';
        if (indirectAchievement) {
          const percentage = Number(indirectAchievement.achievementPercentage);
          indirectValue = isNaN(percentage) ? '0%' : `${Math.round(percentage)}%`;
        }

        console.log(`${properCloName}: Direct=${directValue}, Indirect=${indirectValue}`);

        excelData.push([
          cloIndex === 0 ? (courseIndex + 1).toString() : '', // S No only on first CLO row
          cloIndex === 0 ? (courseData.course.level || 12).toString() : '', // Level only on first CLO row
          cloIndex === 0 ? `${courseData.course.course_name} ${courseData.course.course_code}` : '', // Course name only on first CLO row
          properCloName, // Use proper CLO name (CLO 1, CLO 2, etc.)
          directValue, // Direct achievement
          indirectValue // Indirect achievement
        ]);
        currentRow++;
      });

      // Add merges for course info spanning multiple CLO rows
      if (sortedCourseClos.length > 1) {
        const endRow = currentRow - 1;
        // Merge S No column
        merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
        // Merge Level column
        merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } });
        // Merge Course Name & Code column
        merges.push({ s: { r: startRow, c: 2 }, e: { r: endRow, c: 2 } });
        // Don't merge CLO Achievement columns since they contain different data per row
      }
    });

    // Create worksheet from array
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Add header merge for CLO Achievement
    merges.unshift({ s: { r: 0, c: 4 }, e: { r: 0, c: 5 } });

    worksheet['!merges'] = merges;

    // Add styling and formatting
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Style headers with yellow background
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell1 = XLSX.utils.encode_cell({ r: 0, c: C });
      const headerCell2 = XLSX.utils.encode_cell({ r: 1, c: C });

      if (!worksheet[headerCell1]) worksheet[headerCell1] = { t: 's', v: '' };
      if (!worksheet[headerCell2]) worksheet[headerCell2] = { t: 's', v: '' };

      worksheet[headerCell1].s = {
        fill: { fgColor: { rgb: "FFFF99" } },
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };

      worksheet[headerCell2].s = {
        fill: { fgColor: { rgb: "FFFF99" } },
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }

    // Style data rows with alternating colors and borders
    for (let R = 2; R <= range.e.r; ++R) {
      const isEvenCourse = Math.floor((R - 2) / 6) % 2 === 0; // Assuming avg 6 CLOs per course
      const bgColor = isEvenCourse ? "E6F3FF" : "F0F8FF";

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: '' };

        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }

    // Set column widths
    worksheet['!cols'] = [
      { width: 8 },   // S No
      { width: 8 },   // Level
      { width: 25 },  // Course Name & Code
      { width: 10 },  // CLOs
      { width: 10 },  // Direct
      { width: 10 }   // Indirect
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment Report');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

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