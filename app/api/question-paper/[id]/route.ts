import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { generateQuestionsByPaperId } from '@/services/question-bank/generate-qp.service';
import { generateQuestionPaperHTML } from '@/templates/questionPaper';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await connectToMongoDB();

        const { searchParams } = new URL(request.url);
        const withAnswers = searchParams.get('withAnswers') === 'true';

        const questionPaperData = await generateQuestionsByPaperId(params.id, withAnswers);
        
        const htmlContent = generateQuestionPaperHTML({
            ...questionPaperData,
            withAnswers
        });

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${questionPaperData.examName.replace(/\s+/g, '_')}_${withAnswers ? 'with_answers' : 'questions'}.html"`,
            },
        });

    } catch (error) {
        console.error('Question paper generation error:', error);
        return NextResponse.json({
            message: 'Error generating question paper',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 