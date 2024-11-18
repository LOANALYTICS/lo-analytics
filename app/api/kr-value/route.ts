// src/app/api/upload-excel/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { 
    extractQuestionAnswerKeys, 
    calculatePValues, 
    calculateQValues, 
    calculatePQValues, 
    calculateTotalPQValue, 
    extractStudentScores, 
    calculateStudentScoreVariance, 
    extractItemAnalysisData, 
    calculateStudentGrades,
    groupByClassification
} from '@/server/utils/kr-utils';
import { generateHTML } from '@/services/KR20GenerateHTML';odimport College from '@/server/models/college.model';
el';

// Configure API route settings
export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parsing
  },
};

function calculateGradeDistribution(results: any[]) {
  // Define all possible grades in order
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  
  // Get total count of all students
  const totalStudents = results.length;
  
  // Calculate distribution for each grade
  const distribution = grades.map(grade => {
    const studentsWithGrade = results.filter(student => student.grade === grade);
    const count = studentsWithGrade.length;
    const studentPercentage = (count / totalStudents) * 100;
    
    return {
      grade,
      count,
      studentPercentage: Number(studentPercentage.toFixed(2))
    };
  });
  
  return distribution;
}

export async function POST(request: Request) {
  try {
    // Use request.formData() to handle incoming form data
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ message: 'File is missing' }, { status: 400 });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read the workbook using XLSX from buffer
    const workbook = XLSX.read(buffer);

    // Define sheet names
    const ResultsGridsheetName = 'Results Grid';
    const itemAnalysisSheetName = 'Item Analysis';

    // Check for required sheets
    if (!workbook.Sheets[ResultsGridsheetName]) {
      return NextResponse.json({ message: `Sheet "${ResultsGridsheetName}" not found` }, { status: 404 });
    }

    if (!workbook.Sheets[itemAnalysisSheetName]) {
      return NextResponse.json({ message: `Sheet "${itemAnalysisSheetName}" not found` }, { status: 404 });
    }

    // Convert sheets to JSON
    const sheet = workbook.Sheets[ResultsGridsheetName];
    const data: Array<Array<string | number>> = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const itemAnalysisSheet = workbook.Sheets[itemAnalysisSheetName];
    const itemAnalysisData: Array<Array<string | number>> = XLSX.utils.sheet_to_json(itemAnalysisSheet, { header: 1 });

    // Validate minimum data
    if (data.length < 3) {
      return NextResponse.json({ message: 'Not enough data in the sheet' }, { status: 400 });
    }

    // Extract question-answer key mapping and calculate necessary values
    const questionKeys = extractQuestionAnswerKeys(data);
    const totalQuestions = Object.keys(questionKeys).length;
    const p_values = calculatePValues(data, questionKeys);
    const q_values = calculateQValues(p_values);
    const pq_values = calculatePQValues(p_values, q_values);
    const totalPQValue = calculateTotalPQValue(pq_values);
    const studentScores = extractStudentScores(data);
    const variance = calculateStudentScoreVariance(studentScores);
    const itemAnalysisResults = extractItemAnalysisData(itemAnalysisData);
    const KR_20 = (totalQuestions / (totalQuestions - 1)) * (1 - totalPQValue / variance);
    const gradedStudents = calculateStudentGrades(studentScores);
    const groupedItemAnalysisResults = groupByClassification(itemAnalysisResults);
    const gradeDistribution = calculateGradeDistribution(gradedStuden    // Get courseId and collegeId from request body
    const { courseId, collegeId } = await request.json();
ts);ou    if (!courseId || !collegeId) {
      return NextResponse.json({ message: 'Course ID and College ID are required' }, { status: 400 });
    }

    // Find course from database
    const courseData = await Course.findById(courseId)
      .select('course_name level sem department course_code credit_hours no_of_student students_withdrawn student_absent coordinator')
      .lean();

    if (!courseData) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 }); 
    }

    // Find college from database
    const collegeData = await College.findById(collegeId).lean();

    if (!collegeData) {
      return NextResponse.json({ message: 'College not found' }, { status: 404 });
    }

    const course = {
      name: courseData.course_name,
      level: courseData.level,
      semester: courseData.sem,
      coordinator: courseData.coordinator,
      code: courseData.course_code,
      creditHours: courseData.credit_hours,
      studentsNumber: courseData.no_of_student,
      studentsWithdrawn: courseData.students_withdrawn,
      studentsAbsent: courseData.student_absent,
      studentsAttended: courseData.no_of_student - (courseData.students_withdrawn + courseData.student_absent),
      studentsPassed: passedStudents
    };
rse.
    // Calculate passed students
    const totalStudents = gradeDistribution.reduce((sum, grade) => sum + grade.count, 0);
    const failedCount = gradeDistribution.find(g => g.grade === 'F')?.count || 0;
    const passedStudents = {
      number: totalStudents - failedCount,
      percentage: ((totalStudents - failedCount) / totalStudents * 100).toFixed(2)
       }
    const collegeInfo      logo: collegeData.logo,.png",
      colleg        english: collegeData.english,
        regional: collegeData.regional,
        university: collegeData.university Name"
      }
    }
    const KR20HTML = generateHTML({
      groupedItemAnalysisResults:[...groupedItemAnalysisResults,  {
        classification: "Reliability",
        questions: [
          { question: "KR20" }
        ]
      } ],
      KR_20:KR_20,
      segregatedGradedStudents:gradeDistribution,
      course:course,
      collegeInfo:collegeInfo
    })
// const data1 = [{
//   // groupedItemAnalysisResults:groupedItemAnalysisResults,
//   // KR_20:KR_20,
//   // gradeDistribution:gradeDistribution,
//   // course:course,
//   // collegeInfo:collegeInfo
//   gradedStudents:gradedStudents
//     }]
    // return new NextResponse(JSON.stringify(data1))
    return new NextResponse(KR20HTML)

    // Return final JSON response
    // return NextResponse.json(
    //   { 
    //     groupedItemAnalysisResults,
    //     gradeDistribution,
    //     gradedStudents,
    //     KR_20,
    //     itemAnalysisResults,
    //     variance, 
    //     questionKeys, 
    //     totalQuestions, 
    //     p_values, 
    //     q_values, 
    //     pq_values, 
    //     totalPQValue, 
    //     studentScores 
    //   }, 
    //   { status: 200 }
    // );

  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { 
        message: 'Error processing Excel file', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
