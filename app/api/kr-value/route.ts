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
import { generateHTML } from '@/services/KR20GenerateHTML';
import { connectToMongoDB } from '@/lib/db';
import { Collage, Course, KRValue } from '@/lib/models';


// Configure API route settings
export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parsing
  },
};

interface GradeDistribution {
  grade: string;
  count: number;
  studentPercentage: number;
}

function calculateGradeDistribution(results: any[]): GradeDistribution[] {
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  const totalStudents = results.length;
  
  return grades.map(grade => {
    const studentsWithGrade = results.filter(student => student.grade === grade);
    const count = studentsWithGrade.length;
    const studentPercentage = (count / totalStudents) * 100;
    
    return {
      grade,
      count,
      studentPercentage: Number(studentPercentage.toFixed(2))
    };
  });
}

export async function POST(request: Request) {
  try {
    // Get the cookies from the request headers
    const cookieHeader = request.headers.get('cookie');
    const cookies = new Map(
      cookieHeader?.split(';').map(cookie => {
        const [key, value] = cookie.trim().split('=');
        return [key, value];
      }) || []
    );
    
    const userInformationCookie = cookies.get('userInformation');
    
    if (!userInformationCookie) {
      return NextResponse.json({ error: "User information not found" }, { status: 401 });
    }

    const userInformation = JSON.parse(decodeURIComponent(userInformationCookie));
    
    await connectToMongoDB()
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const courseId = formData.get('courseId') as string;
    const collegeId = formData.get('collageId') as string;

    if (!file || !courseId || !collegeId) {
      return NextResponse.json({ 
        message: 'File, Course ID and College ID are required' 
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer);

    const ResultsGridsheetName = 'Results Grid';
    const itemAnalysisSheetName = 'Item Analysis';

    if (!workbook.Sheets[ResultsGridsheetName] || !workbook.Sheets[itemAnalysisSheetName]) {
      return NextResponse.json({ 
        message: 'Required sheets not found' 
      }, { status: 404 });
    }

    const sheet = workbook.Sheets[ResultsGridsheetName];
    const data: Array<Array<string | number>> = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const itemAnalysisSheet = workbook.Sheets[itemAnalysisSheetName];
    const itemAnalysisData: Array<Array<string | number>> = XLSX.utils.sheet_to_json(itemAnalysisSheet, { header: 1 });

    if (data.length < 3) {
      return NextResponse.json({ 
        message: 'Not enough data in the sheet' 
      }, { status: 400 });
    }

    // Calculate all required values
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
    const gradeDistribution = calculateGradeDistribution(gradedStudents);

    // Fetch course and college data
    const courseData: any = await Course.findById(courseId)
      .populate('collage')
      .select('course_name level semister department course_code credit_hours no_of_student students_withdrawn student_absent coordinator')
      .lean();

    if (!courseData || !courseData.collage) {
      return NextResponse.json({ 
        message: 'Course or College not found' 
      }, { status: 404 });
    }

    const collegeInfo = {
      logo: courseData.collage.logo,
      english: courseData.collage.english,
      regional: courseData.collage.regional,
      university: courseData.collage.university
    };

    // Calculate passed students
    const totalStudents = gradeDistribution.reduce((sum, grade) => sum + grade.count, 0);
    const failedCount = gradeDistribution.find(g => g.grade === 'F')?.count || 0;
    const passedStudents = {
      number: totalStudents - failedCount,
      percentage: ((totalStudents - failedCount) / totalStudents * 100).toFixed(2)
    };

    const course = {
      course_name: courseData.course_name,
      level: courseData.level,
      semister: courseData.semister,
      coordinator: userInformation.name,
      course_code: courseData.course_code,
      credit_hours: courseData.credit_hours,
      studentsNumber: courseData.no_of_student,
      studentsWithdrawn: courseData.students_withdrawn,
      studentsAbsent: courseData.student_absent,
      studentsAttended: courseData.no_of_student - (courseData.students_withdrawn + courseData.student_absent),
      studentsPassed: passedStudents
    };

    console.log(course, "krs")

    // Create KR value document
    const krValueDoc = await KRValue.create({
      courseId: courseData._id,
      KR_20: KR_20,
      groupedItemAnalysisResults: [
        ...groupedItemAnalysisResults,
        {
          classification: "Reliability",
          questions: [{ question: "KR20" }]
        }
      ],
      gradeDistribution: gradeDistribution
    });

    // Update course with KR value reference
    await Course.findByIdAndUpdate(
      courseData._id,
      {
        krValues: krValueDoc._id
      },
      { new: true }
    ).exec();

    // Add error handling
    console.log('KR Value Document:', krValueDoc);
    console.log('Course ID:', courseData._id);

    // Generate and return HTML response
    const KR20HTML = generateHTML({
      groupedItemAnalysisResults: [
        ...groupedItemAnalysisResults,
        {
          classification: "Reliability",
          questions: [{ question: "KR20" }]
        }
      ],
      KR_20,
      segregatedGradedStudents: gradeDistribution,
      course,
      collegeInfo
    });
//  return  Response.json({
//   message: "KR Value Generated Successfully",
//   data: itemAnalysisResults
//  })
    return new NextResponse(KR20HTML);

  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json({ 
      message: 'Error processing Excel file', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
