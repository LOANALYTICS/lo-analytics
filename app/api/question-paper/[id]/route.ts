import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { generateQuestionsByPaperId } from '@/services/question-bank/generate-qp.service';
import { generateQuestionPaperHTML } from '@/templates/questionPaper';
import { Course } from '@/lib/models';
interface CourseData {
    course_name: string;
    level: number;
    semister: number;
    department: string;
    course_code: string;
    credit_hours: string;
    academic_year:string
    collage: {
      logo: string;
      english: string;
      regional: string;
      university: string;
    };
  }
  
export async function GET(
    request: Request,
    { params }: any
) {
    try {
        await connectToMongoDB();

        const { searchParams } = new URL(request.url);
        const withAnswers = searchParams.get('withAnswers') === 'true';
        const courseId = searchParams.get('courseId');

           // Get course data with college info
    const courseData = await Course.findOne({
        _id: courseId,
      })
      .populate('collage')
      .select('course_name level semister department course_code credit_hours collage,academic_year')
      .lean() as unknown as CourseData;
  
      if (!courseData) {
        return NextResponse.json({
          message: 'Course not found',
          status: 'error'
        }, { status: 404 });
      }
  

        const questionPaperData = await generateQuestionsByPaperId(params.id, withAnswers);
        
        const htmlContent = generateQuestionPaperHTML({
            ...questionPaperData,
            withAnswers,
            course: {
                course_name: courseData.course_name,
                level: courseData.level,
                semister: courseData.semister,
                department: courseData.department,
                course_code: courseData.course_code,
                credit_hours: courseData.credit_hours,
                academic_year:courseData.academic_year
              },
              college: courseData.collage,
        });


        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${questionPaperData.examName.replace(/\s+/g, '_')}_${withAnswers ? 'with_answers' : 'questions'}.html"`,
            },
        });

    } catch (error) {
        console.error('Question paper generation error:', error);
        return new NextResponse(JSON.stringify({
            message: 'Error generating question paper',
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
} 