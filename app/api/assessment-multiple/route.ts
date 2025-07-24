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
        console.log('=== MULTIPLE MODE DATA ===');
        console.log('Course ID:', courseId);
        console.log('Assessment Type:', type);
        console.log('Data length:', data.length);

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

        console.log('=== STUDENT INFO ===');
        console.log(studentInfo);
        console.log('=== STUDENT ANSWERS ===');
        console.log(studentAnswers);

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

        // Calculate total questions
        const totalQuestions = (Object.values(assessmentConfig.clos) as number[][]).flat().length;
        const marksPerQuestion = Number((assessmentConfig.weight / totalQuestions).toFixed(2));

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
                    totalMarks: assessmentConfig.weight
                },
                cloResults: {}
            };

            // Initialize CLO results
            for (const [cloId, questions] of cloMap.entries()) {
                const cloTotalMarks = Number(((questions.length / totalQuestions) * assessmentConfig.weight).toFixed(2));
                studentResult.cloResults[cloId] = {
                    totalQuestions: questions.length,
                    correctAnswers: 0,
                    marksScored: 0,
                    totalMarks: cloTotalMarks
                };
            }

            // Calculate scores based on 1s and 0s
            for (const [cloId, questions] of cloMap.entries()) {
                for (const questionNumber of questions) {
                    const answer = studentAnswer.answers[questionNumber];
                    if (answer === '1') {
                        studentResult.cloResults[cloId].correctAnswers++;
                        studentResult.totalScore.correct++;
                    }
                }
            }

            // Calculate final scores
            studentResult.totalScore.marksScored = Number((studentResult.totalScore.correct * marksPerQuestion).toFixed(2));
            studentResult.totalScore.percentage = Number(((studentResult.totalScore.marksScored / assessmentConfig.weight) * 100).toFixed(2));

            // Calculate CLO marks
            for (const [cloId, cloResult] of Object.entries(studentResult.cloResults)) {
                cloResult.marksScored = Number((cloResult.correctAnswers * marksPerQuestion).toFixed(2));
            }

            studentResults.push(studentResult);
        }

        console.log('=== CALCULATED RESULTS ===');
        console.log(studentResults);

        // Update database
        const assessment = await Assessment.findOne({ course: courseId });
        if (!assessment) {
            return NextResponse.json({
                message: 'Assessment not found'
            }, { status: 404 });
        }

        // Create question keys (for multiple mode, all answers are "1" since we use 1/0 scoring)
        const questionKeys: { questionNumber: string; correctAnswer: string }[] = [];
        for (let i = 1; i <= totalQuestions; i++) {
            questionKeys.push({
                questionNumber: `Q${i}`,
                correctAnswer: '1' // In multiple mode, correct answer is always "1"
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
        console.log('Assessment saved successfully');

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