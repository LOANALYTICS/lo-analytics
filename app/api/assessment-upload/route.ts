import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { connectToMongoDB } from '@/lib/db';
import { Course } from '@/lib/models';
import { getAssessmentByCourse } from '@/services/assessment.action';

// Configure API route settings
export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parsing
  },
};

interface QuestionKey {
  questionNumber: string;
  correctAnswer: string;
}

interface StudentResult {
  studentId: string;
  studentName: string;
  totalScore: {
    correct: number;
    total: number;
    percentage: number;
  };
  cloResults: {
    [cloId: string]: {
      totalQuestions: number;
      correctAnswers: number;
    };
  };
}

interface AssessmentType {
  type: string;
  clos: {
    [key: string]: number[];
  };
}

function extractQuestionKeys(data: Array<Array<string | number>>): QuestionKey[] {
  const questionRow = data[0];
  const keyRow = data[1];
  const keys: QuestionKey[] = [];

  // Start from index 6 (7th column) as per the Excel structure
  for (let i = 6; i < questionRow.length; i++) {
    const questionCol = String(questionRow[i]);
    if (questionCol.toLowerCase().startsWith('q')) {
      keys.push({
        questionNumber: questionCol.replace(/\s+/g, ''), 
        correctAnswer: String(keyRow[i]).toUpperCase()
      });
    }
  }

  return keys;
}

function mapQuestionsToCLOs(questionKeys: QuestionKey[], assessment: any, assessmentType: string): Map<string, string[]> {
  const cloMap = new Map<string, string[]>();
  
  // Get the assessment type from the assessment data
  const assessmentData = assessment.assessments.find((a: AssessmentType) => a.type === assessmentType);
  
  if (assessmentData && assessmentData.clos) {
    (Object.entries(assessmentData.clos) as [string, number[]][]).forEach(([cloId, questions]) => {
      const questionNumbers = questions.map(q => `Q${q}`);
      cloMap.set(cloId, questionNumbers);
    });
  }

  return cloMap;
}

function calculateStudentResults(
  data: Array<Array<string | number>>, 
  questionKeys: QuestionKey[],
  cloMap: Map<string, string[]>
): StudentResult[] {
  const results: StudentResult[] = [];

  // Start from index 2 (3rd row) for student data
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const studentResult: StudentResult = {
      studentId: String(row[1]), // ID Number column
      studentName: String(row[0]), // Student Name column
      totalScore: {
        correct: 0,
        total: questionKeys.length,
        percentage: 0
      },
      cloResults: {}
    };

    // Initialize CLO results
    for (const [cloId, questions] of cloMap.entries()) {
      studentResult.cloResults[cloId] = {
        totalQuestions: questions.length,
        correctAnswers: 0
      };
    }

    // Check each answer starting from column 7
    for (let j = 6; j < row.length; j++) {
      const studentAnswer = String(row[j]).toUpperCase();
      const questionKey = questionKeys[j - 6];
      
      if (questionKey) {
        // Find which CLO this question belongs to
        for (const [cloId, questions] of cloMap.entries()) {
          if (questions.includes(questionKey.questionNumber)) {
            if (studentAnswer === questionKey.correctAnswer) {
              studentResult.cloResults[cloId].correctAnswers++;
              studentResult.totalScore.correct++;
            }
            break;
          }
        }
      }
    }

    // Calculate percentage
    studentResult.totalScore.percentage = Number(((studentResult.totalScore.correct / studentResult.totalScore.total) * 100).toFixed(2));

    results.push(studentResult);
  }

  return results;
}

export async function POST(request: Request) {
  try {
    // Get the cookies from the request headers
    // const cookieHeader = request.headers.get('cookie');
    // const cookies = new Map(
    //   cookieHeader?.split(';').map(cookie => {
    //     const [key, value] = cookie.trim().split('=');
    //     return [key, value];
    //   }) || []
    // );
    
    // const userInformationCookie = cookies.get('userInformation');
    
    
    // if (!userInformationCookie) {
    //   return NextResponse.json({ error: "User information not found" }, { status: 401 });
    // }

    // const userInformation = JSON.parse(decodeURIComponent(userInformationCookie));
    
    await connectToMongoDB();
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const courseId = formData.get('courseId') as string;
    const type = formData.get('type') as string;

    if (!file || !courseId || !type) {
      return NextResponse.json({ 
        message: 'File, Course ID and Assessment Type are required' 
      }, { status: 400 });
    }

    // Get assessment data for the course
    const assessmentResponse = await getAssessmentByCourse(courseId);
    if (!assessmentResponse.success || !assessmentResponse.data) {
      return NextResponse.json({ 
        message: 'Assessment not found for this course' 
      }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer);

    const ResultsGridsheetName = 'Results Grid';

    if (!workbook.Sheets[ResultsGridsheetName]) {
      return NextResponse.json({ 
        message: 'Results Grid sheet not found' 
      }, { status: 404 });
    }

    const sheet = workbook.Sheets[ResultsGridsheetName];
    const data: Array<Array<string | number>> = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 3) {
      return NextResponse.json({ 
        message: 'Not enough data in the sheet' 
      }, { status: 400 });
    }

    // Process the data
    const questionKeys = extractQuestionKeys(data);
    const cloMap = mapQuestionsToCLOs(questionKeys, assessmentResponse.data, type);
    const studentResults = calculateStudentResults(data, questionKeys, cloMap);

    return NextResponse.json({
      message: "Successfully processed assessment data",
      data: {
        questionKeys,
        cloMapping: Object.fromEntries(cloMap),
        studentResults
      }
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json({ 
      message: 'Error processing Excel file', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 