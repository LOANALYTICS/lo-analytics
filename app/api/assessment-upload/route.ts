import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { connectToMongoDB } from '@/lib/db';
import { Course, Assessment } from '@/lib/models';
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
  cloMap: Map<string, string[]>,
  assessment: any
): StudentResult[] {
  const results: StudentResult[] = [];

  // Create a map of student IDs to names from the assessment model
  // Note: studentName in model actually contains the ID, and studentId contains the name
  const studentMap = new Map(
    assessment.students.map((student: { studentId: string; studentName: string }) => 
      [student.studentName.toLowerCase().trim(), student.studentId]  // Swap these since they're reversed in model
    )
  );

  console.log('Debug Info:');
  console.log('Student ID Map:', Object.fromEntries(studentMap));

  // Start from index 2 (3rd row) for student data
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue; // Skip empty rows

    // Get student ID from Excel (2nd column)
    const excelStudentId = String(row[1] || '').trim();
    
    if (!excelStudentId) {
      console.log(`Skipping row ${i + 1}: No student ID`);
      continue;
    }

    // Try to find student in assessment model
    const studentName = studentMap.get(excelStudentId.toLowerCase());

    if (!studentName || typeof studentName !== 'string') {
      console.warn(`Student not found for ID: ${excelStudentId}`);
      continue;
    }

    const studentResult: StudentResult = {
      studentId: excelStudentId,
      studentName: studentName,
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
      const studentAnswer = String(row[j] || '').toUpperCase();
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

  console.log('\nProcessing Summary:');
  console.log('Total results processed:', results.length);
  if (results.length > 0) {
    console.log('First processed result:', results[0]);
  }
  
  return results;
}

export async function POST(request: Request) {
  try {
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

    // Get all student IDs from Excel (starting from row 3)
    const excelStudentIds = data.slice(2)
      .map(row => row && row[1])
      .filter((id): id is string | number => id !== undefined && id !== null)
      .map(id => String(id).trim());

    // Get all student IDs from assessment model
    const assessmentStudentIds = new Set(
      assessmentResponse.data.students.map(
        (student: { studentName: string }) => student.studentName.trim()
      )
    );

    // Check if we have all required students
    if (excelStudentIds.length === 0) {
      return NextResponse.json({
        message: 'No student IDs found in the Excel file',
        status: 'error'
      }, { status: 400 });
    }

    // Find missing students (IDs in Excel but not in assessment)
    const missingStudents = excelStudentIds.filter(id => !assessmentStudentIds.has(id));
    
    // Find extra students (IDs in assessment but not in Excel)
    const extraStudents = Array.from(assessmentStudentIds)
      .filter((id): id is string => typeof id === 'string' && !excelStudentIds.includes(id));

    if (missingStudents.length > 0) {
      return NextResponse.json({
        message: 'Some student IDs in Excel file are not found in the course',
        status: 'error',
        details: {
          missingStudents,
          totalInExcel: excelStudentIds.length,
          totalInCourse: assessmentStudentIds.size
        }
      }, { status: 400 });
    }

    if (excelStudentIds.length < assessmentStudentIds.size) {
      return NextResponse.json({
        message: 'Excel file has fewer students than enrolled in the course',
        status: 'error',
        details: {
          missingFromExcel: extraStudents,
          totalInExcel: excelStudentIds.length,
          totalInCourse: assessmentStudentIds.size
        }
      }, { status: 400 });
    }

    if (excelStudentIds.length > assessmentStudentIds.size) {
      return NextResponse.json({
        message: 'Excel file has more students than enrolled in the course',
        status: 'error',
        details: {
          extraStudents: excelStudentIds.filter(id => !assessmentStudentIds.has(id)),
          totalInExcel: excelStudentIds.length,
          totalInCourse: assessmentStudentIds.size
        }
      }, { status: 400 });
    }

    // If counts match but IDs are different
    if (extraStudents.length > 0) {
      return NextResponse.json({
        message: 'Student IDs in Excel do not match with enrolled students',
        status: 'error',
        details: {
          unmatchedIds: {
            missingFromExcel: extraStudents,
            extraInExcel: excelStudentIds.filter(id => !assessmentStudentIds.has(id))
          },
          totalInExcel: excelStudentIds.length,
          totalInCourse: assessmentStudentIds.size
        }
      }, { status: 400 });
    }

    // Continue with existing processing if all validations pass
    const questionKeys = extractQuestionKeys(data);
    const cloMap = mapQuestionsToCLOs(questionKeys, assessmentResponse.data, type);
    const studentResults = calculateStudentResults(data, questionKeys, cloMap, assessmentResponse.data);

    // Update or create assessment results
    const assessment = await Assessment.findOne({ course: courseId });
    if (!assessment) {
      return NextResponse.json({ 
        message: 'Assessment not found' 
      }, { status: 404 });
    }

    // Check if results for this type already exist
    const existingResultIndex = assessment.assessmentResults.findIndex(
      (result: { type: string }) => result.type === type
    );

    const newResult = {
      type,
      results: studentResults,
      questionKeys
    };

    if (existingResultIndex !== -1) {
      // Update existing results
      assessment.assessmentResults[existingResultIndex] = newResult;
    } else {
      // Add new results
      assessment.assessmentResults.push(newResult);
    }

    await assessment.save();

    return NextResponse.json({
      message: "Successfully processed and stored assessment data",
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