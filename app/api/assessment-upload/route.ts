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
}

interface AssessmentType {
  type: string;
  clos: {
    [key: string]: number[];
  };
}
export const dynamic = 'force-dynamic';

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
        (student: { studentId: string }) => student.studentId.trim()
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

    // Get the assessment type configuration
    const assessmentConfig = assessmentResponse.data.assessments.find((a: AssessmentType) => a.type === type);
    if (!assessmentConfig) {
      return NextResponse.json({ 
        message: 'Assessment type configuration not found' 
      }, { status: 404 });
    }

    // Count total questions from CLOs
    let totalQuestionsInCLOs = 0;
    for (const questions of Object.values(assessmentConfig.clos) as number[][]) {
      totalQuestionsInCLOs += questions.length;
    }

    // Count questions from Excel
    const totalQuestionsInExcel = questionKeys.length;

    if (totalQuestionsInCLOs !== totalQuestionsInExcel) {
      return NextResponse.json({
        message: 'Number of questions mismatch',
        status: 'error',
        details: {
          excelQuestions: totalQuestionsInExcel,
          configuredQuestions: totalQuestionsInCLOs,
          difference: Math.abs(totalQuestionsInExcel - totalQuestionsInCLOs)
        }
      }, { status: 400 });
    }

    const studentResults = calculateStudentResults(data, questionKeys, cloMap, assessmentResponse.data, type);

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

    // Convert student results to plain objects to ensure proper MongoDB document structure
    const formattedResults = studentResults.map(result => ({
      studentId: result.studentId,
      studentName: result.studentName,
      totalScore: {
        correct: result.totalScore.correct,
        total: result.totalScore.total,
        percentage: result.totalScore.percentage,
        marksScored: result.totalScore.marksScored,
        totalMarks: result.totalScore.totalMarks
      },
      cloResults: Object.fromEntries(
        Object.entries(result.cloResults).map(([cloId, cloResult]) => [
          cloId,
          {
            totalQuestions: cloResult.totalQuestions,
            correctAnswers: cloResult.correctAnswers,
            marksScored: cloResult.marksScored,
            totalMarks: cloResult.totalMarks
          }
        ])
      )
    }));

    const newResult = {
      type,
      results: formattedResults,
      questionKeys: questionKeys.map(key => ({
        questionNumber: key.questionNumber,
        correctAnswer: key.correctAnswer
      }))
    };

    console.log('Debug - Assessment Results before update:', JSON.stringify(assessment.assessmentResults, null, 2));
    console.log('Debug - New Result:', JSON.stringify(newResult, null, 2));
    console.log('Debug - Existing Result Index:', existingResultIndex);

    // Create a new array with the updated results
    const updatedResults = [...assessment.assessmentResults];
    if (existingResultIndex !== -1) {
      // Update existing results
      updatedResults[existingResultIndex] = newResult;
    } else {
      // Add new results
      updatedResults.push(newResult);
    }

    // Update the assessment with the new array
    assessment.assessmentResults = updatedResults;

    // Mark the field as modified
    assessment.markModified('assessmentResults');

    try {
      await assessment.save();
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }

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


//extra functions

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
    assessment: any,
    type: string
  ): StudentResult[] {
    const results: StudentResult[] = [];
  
    // Get the assessment type configuration
    const assessmentConfig = assessment.assessments.find((a: any) => a.type === type);
    if (!assessmentConfig) {
      throw new Error('Assessment type configuration not found');
    }
  
    // Calculate marks per question based on total weight
    const totalQuestions = questionKeys.length;
    const marksPerQuestion = Number((assessmentConfig.weight / totalQuestions).toFixed(2));
  
    const studentMap = new Map(
      assessment.students.map((student: { studentId: string; studentName: string }) => 
        [student.studentId.trim(), student.studentName]  // Now using studentId as key, studentName as value
      )
    );
  
    console.log('Debug Info:');
    console.log('Student ID Map:', Object.fromEntries(studentMap));
  
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
  
      const excelStudentId = String(row[1] || '').trim();
      if (!excelStudentId) {
        console.log(`Skipping row ${i + 1}: No student ID`);
        continue;
      }
  
      const studentName = studentMap.get(excelStudentId);  // Now correctly looking up by ID
      if (!studentName || typeof studentName !== 'string') {
        console.warn(`Student not found for ID: ${excelStudentId}`);
        continue;
      }
  
      const totalMarks = assessmentConfig.weight;
  
      const studentResult: StudentResult = {
        studentId: excelStudentId,
        studentName: studentName,
        totalScore: {
          correct: 0,
          total: questionKeys.length,
          percentage: 0,
          marksScored: 0,
          totalMarks: totalMarks
        },
        cloResults: {}
      };
  
      // Initialize CLO results
      for (const [cloId, questions] of cloMap.entries()) {
        const cloTotalMarks = Number(((questions.length / totalQuestions) * totalMarks).toFixed(2));
        studentResult.cloResults[cloId] = {
          totalQuestions: questions.length,
          correctAnswers: 0,
          marksScored: 0,
          totalMarks: cloTotalMarks
        };
      }
  
      // Check answers
      for (let j = 6; j < row.length; j++) {
        const studentAnswer = String(row[j] || '').toUpperCase();
        const questionKey = questionKeys[j - 6];
        
        if (questionKey) {
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
  
      // Calculate total marks scored
      studentResult.totalScore.marksScored = Number((studentResult.totalScore.correct * marksPerQuestion).toFixed(2));
      studentResult.totalScore.percentage = Number(((studentResult.totalScore.marksScored / totalMarks) * 100).toFixed(2));
  
      // Calculate CLO marks
      for (const [cloId, cloResult] of Object.entries(studentResult.cloResults)) {
        cloResult.marksScored = Number((cloResult.correctAnswers * marksPerQuestion).toFixed(2));
      }
  
      results.push(studentResult);
    }
  
    console.log('\nProcessing Summary:');
    console.log('Total results processed:', results.length);
    if (results.length > 0) {
      console.log('First processed result:', results[0]);
    }
    
    return results;
  }
  