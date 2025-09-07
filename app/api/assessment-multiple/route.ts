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

        const body = await request.json();
        const { courseId, type, data } = body;

        if (!courseId || !type || !data) {
            return NextResponse.json({
                message: 'Course ID, Assessment Type, and data are required'
            }, { status: 400 });
        }

        // Console log the received data
        // console.log('=== MULTIPLE MODE DATA ===');
        // console.log('Course ID:', courseId);
        // console.log('Assessment Type:', type);
        // console.log('Data length:', data.length);

        // Get assessment data for the course
        const assessmentResponse = await getAssessmentByCourse(courseId);
        if (!assessmentResponse.success || !assessmentResponse.data) {
            return NextResponse.json({
                message: 'Assessment not found for this course'
            }, { status: 404 });
        }

        if (data.length < 3) {
            return NextResponse.json({
                message: 'Not enough data provided'
            }, { status: 400 });
        }

        // Extract question marks from key row (row 1, columns 6+)
        const keyRow = data[1];
        const questionMarks: { [key: string]: number } = {};
        let totalQuestions = 0;

        for (let j = 6; j < keyRow.length; j++) {
            const questionNumber = j - 5; // Q1 = index 6, so Q1 = 6-5 = 1
            const marks = Number(keyRow[j]) || 0;
            questionMarks[`Q${questionNumber}`] = marks;
            totalQuestions++;
        }

        // Separate student info and answers
        const studentInfo: { name: string; id: string }[] = [];
        const studentAnswers: { studentId: string; answers: { [key: string]: string } }[] = [];

        // Skip header row (index 0) and key row (index 1), start from student data (index 2)
        for (let i = 2; i < data.length; i++) {
            const row = data[i];
            if (row && row.length > 0) {
                // Student info object (name and ID)
                const student = {
                    name: row[0] || '',
                    id: row[1] || ''
                };
                studentInfo.push(student);

                // Student answers object (Q1 to last question)
                const answers: { [key: string]: string } = {};
                // Questions start from index 6 (Q1, Q2, etc.)
                for (let j = 6; j < row.length; j++) {
                    const questionNumber = j - 5; // Q1 = index 6, so Q1 = 6-5 = 1
                    answers[`Q${questionNumber}`] = row[j] || '';
                }
                studentAnswers.push({
                    studentId: row[1] || '',
                    answers: answers
                });
            }
        }

        // console.log('=== STUDENT INFO ===');
        // console.log(studentInfo);
        // console.log('=== STUDENT ANSWERS ===');
        // console.log(studentAnswers);

        // Validate student IDs
        const dataStudentIds = studentInfo.map(s => s.id).filter(id => id);
        const assessmentStudentIds = new Set(
            assessmentResponse.data.students.map(
                (student: { studentId: string }) => student.studentId.trim()
            )
        );

        // Basic validation
        const missingStudents = dataStudentIds.filter(id => !assessmentStudentIds.has(id));
        if (missingStudents.length > 0) {
            return NextResponse.json({
                message: 'Some student IDs are not found in the course',
                status: 'error',
                details: { missingStudents }
            }, { status: 400 });
        }

        // Get assessment configuration
        const assessmentConfig = assessmentResponse.data.assessments.find((a: AssessmentType) => a.type === type);
        if (!assessmentConfig) {
            return NextResponse.json({
                message: 'Assessment type configuration not found'
            }, { status: 404 });
        }

        // Create CLO mapping
        const cloMap = new Map<string, string[]>();
        if (assessmentConfig.clos) {
            (Object.entries(assessmentConfig.clos) as [string, number[]][]).forEach(([cloId, questions]) => {
                const questionNumbers = questions.map(q => `Q${q}`);
                cloMap.set(cloId, questionNumbers);
            });
        }

        // Calculate total marks from question marks
        const totalMarksFromQuestions = Object.values(questionMarks).reduce((sum, marks) => sum + marks, 0);

        // Calculate student results
        const studentResults: StudentResult[] = [];
        const studentMap = new Map(
            assessmentResponse.data.students.map((student: { studentId: string; studentName: string }) =>
                [student.studentId.trim(), student.studentName]
            )
        );

        for (const studentAnswer of studentAnswers) {
            const studentName = studentMap.get(studentAnswer.studentId);
            if (!studentName || typeof studentName !== 'string') continue;

            const studentResult: StudentResult = {
                studentId: studentAnswer.studentId,
                studentName: studentName,
                totalScore: {
                    correct: 0,
                    total: totalQuestions,
                    percentage: 0,
                    marksScored: 0,
                    totalMarks: totalMarksFromQuestions
                },
                cloResults: {}
            };

            // Initialize CLO results
            for (const [cloId, questions] of cloMap.entries()) {
                // Calculate CLO total marks by summing up marks for questions in this CLO
                const cloTotalMarks = questions.reduce((sum, questionNumber) => {
                    return sum + (questionMarks[questionNumber] || 0);
                }, 0);
                
                studentResult.cloResults[cloId] = {
                    totalQuestions: questions.length,
                    correctAnswers: 0,
                    marksScored: 0,
                    totalMarks: cloTotalMarks
                };
            }

            // Calculate scores by adding up the actual marks scored for each question
            for (const [cloId, questions] of cloMap.entries()) {
                for (const questionNumber of questions) {
                    const answer = studentAnswer.answers[questionNumber];
                    const marksScored = Number(answer) || 0; // Convert answer to number (e.g., "1.5" -> 1.5)

                    studentResult.cloResults[cloId].marksScored += marksScored;
                    studentResult.totalScore.marksScored += marksScored;

                    // Count as correct if student got any marks for the question
                    if (marksScored > 0) {
                        studentResult.cloResults[cloId].correctAnswers++;
                        studentResult.totalScore.correct++;
                    }
                }
            }

            // Calculate final percentage
            studentResult.totalScore.percentage = Number(((studentResult.totalScore.marksScored / totalMarksFromQuestions) * 100).toFixed(2));

            studentResults.push(studentResult);
        }

        // console.log('=== CALCULATED RESULTS ===');
        // console.log(studentResults);

        // Update database
        const assessment = await Assessment.findOne({ course: courseId });
        if (!assessment) {
            return NextResponse.json({
                message: 'Assessment not found'
            }, { status: 404 });
        }

        // Create question keys using marks from key row as correct answers
        const questionKeys: { questionNumber: string; correctAnswer: string }[] = [];
        for (let i = 1; i <= totalQuestions; i++) {
            const questionNumber = `Q${i}`;
            const maxMarks = questionMarks[questionNumber] || 0;
            questionKeys.push({
                questionNumber: questionNumber,
                correctAnswer: String(maxMarks) // Use the max marks from key row as correct answer
            });
        }

        const newResult = {
            type,
            mode: 'general',
            results: studentResults,
            questionKeys
        };

        // Update or add results
        const existingResultIndex = assessment.assessmentResults.findIndex(
            (result: { type: string }) => result.type === type
        );

        const updatedResults = [...assessment.assessmentResults];
        if (existingResultIndex !== -1) {
            updatedResults[existingResultIndex] = newResult;
        } else {
            updatedResults.push(newResult);
        }

        assessment.assessmentResults = updatedResults;
        assessment.markModified('assessmentResults');

        await assessment.save();

        return NextResponse.json({
            message: "Successfully processed and stored assessment data",
            status: "success",
            data: {
                studentResults,
                questionKeys,
                cloMapping: Object.fromEntries(cloMap)
            }
        });

    } catch (error) {
        console.error('Error processing multiple mode data:', error);
        return NextResponse.json({
            message: 'Error processing data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}