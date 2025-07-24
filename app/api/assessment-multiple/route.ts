import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
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

        // Separate student info and answers
        const studentInfo = [];
        const studentAnswers = [];

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
        console.log('========================');

        // Just return success without doing anything else
        return NextResponse.json({
            message: "Data received and logged successfully",
            status: "success",
            dataReceived: {
                studentInfo,
                studentAnswers,
                rowCount: data.length,
                courseId,
                type
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