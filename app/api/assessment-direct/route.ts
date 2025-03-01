import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { Assessment } from '@/lib/models';
import { getAssessmentByCourse } from '@/services/assessment.action';

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

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    const { courseId, type, data } = await request.json();

    if (!courseId || !type || !data) {
      return NextResponse.json({ 
        message: 'Course ID, Assessment Type and Data are required' 
      }, { status: 400 });
    }

    // Get assessment data for the course
    const assessmentResponse = await getAssessmentByCourse(courseId);
    if (!assessmentResponse.success || !assessmentResponse.data) {
      return NextResponse.json({ 
        message: 'Assessment not found for this course' 
      }, { status: 404 });
    }

    // Get total marks from the first row, column G (index 6)
    const totalMarks = Number(data[1][6]) || 0;
    
    // Extract question key (using total marks as the "answer")
    const questionKeys = [{
      questionNumber: "Q1",
      correctAnswer: String(totalMarks)
    }];

    // Get the assessment type configuration
    const assessmentConfig = assessmentResponse.data.assessments.find(
      (a: { type: string }) => a.type === type
    );
    if (!assessmentConfig) {
      return NextResponse.json({ 
        message: 'Assessment type configuration not found' 
      }, { status: 404 });
    }

    // Calculate student results
    const studentResults: StudentResult[] = [];
    const studentMap = new Map(
      assessmentResponse.data.students.map((student: { studentId: string; studentName: string }) => 
        [student.studentId.toLowerCase().trim(), student.studentName]
      )
    );

    // Process each student row (starting from index 2)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const studentId = String(row[1] || '').trim();
      const marksScored = Number(row[6]) || 0;

      if (!studentId) continue;

      const studentName = studentMap.get(studentId.toLowerCase());
      if (!studentName || typeof studentName !== 'string') {
        console.warn(`Student not found for ID: ${studentId}`);
        continue;
      }

      // Calculate percentage
      const percentage = Number(((marksScored / totalMarks) * 100).toFixed(2));

      // Create student result
      const studentResult: StudentResult = {
        studentId,
        studentName,
        totalScore: {
          correct: 1, // Using 1 since we have only one question
          total: 1,
          percentage,
          marksScored,
          totalMarks
        },
        cloResults: {}
      };

      // Map scores to CLOs proportionally
      if (assessmentConfig.clos) {
        (Object.entries(assessmentConfig.clos) as [string, number[]][]).forEach(([cloId, questions]) => {
          const cloWeight = questions.length / Object.values(assessmentConfig.clos).flat().length;
          const cloMarks = Number((totalMarks * cloWeight).toFixed(2));
          const cloScored = Number((marksScored * cloWeight).toFixed(2));

          studentResult.cloResults[cloId] = {
            totalQuestions: 1,
            correctAnswers: 1,
            marksScored: cloScored,
            totalMarks: cloMarks
          };
        });
      }

      studentResults.push(studentResult);
    }

    // Update assessment in database
    const assessment = await Assessment.findOne({ course: courseId });
    if (!assessment) {
      return NextResponse.json({ 
        message: 'Assessment not found' 
      }, { status: 404 });
    }

    const existingResultIndex = assessment.assessmentResults.findIndex(
      (result: { type: string }) => result.type === type
    );

    const newResult = {
      type,
      mode: 'singular',  // Setting mode to 'singular' for direct scores
      results: studentResults,
      questionKeys
    };

    // Update or add new results
    if (existingResultIndex !== -1) {
      assessment.assessmentResults[existingResultIndex] = newResult;
    } else {
      assessment.assessmentResults.push(newResult);
    }

    assessment.markModified('assessmentResults');
    await assessment.save();

    return NextResponse.json({
      message: "Successfully processed and stored assessment data",
      data: {
        questionKeys,
        studentResults
      }
    });

  } catch (error) {
    console.error('Error processing assessment data:', error);
    return NextResponse.json({ 
      message: 'Error processing assessment data', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 