import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { Course } from '@/lib/models';
import { generateAssessmentReportHTML } from '@/templates/assessmentReport';

interface CourseData {
  course_name: string;
  level: number;
  semister: number;
  department: string;
  course_code: string;
  credit_hours: string;
  collage: {
    logo: string;
    english: string;
    regional: string;
    university: string;
  };
}

export async function POST(request: Request) {
  try {
    await connectToMongoDB();
    
    const body = await request.json();
    const { courseId, academicYear } = body;

    if (!courseId || !academicYear) {
      return NextResponse.json({
        message: 'Course ID and Academic Year are required',
        status: 'error'
      }, { status: 400 });
    }

    // Get course data with college info
    const courseData = await Course.findOne({
      _id: courseId,
      academic_year: academicYear
    })
    .populate('collage')
    .select('course_name level semister department course_code credit_hours collage')
    .lean() as unknown as CourseData;

    if (!courseData) {
      return NextResponse.json({
        message: 'Course not found',
        status: 'error'
      }, { status: 404 });
    }

    // Generate HTML content
    const htmlContent = generateAssessmentReportHTML({
      course: {
        course_name: courseData.course_name,
        level: courseData.level,
        semister: courseData.semister,
        department: courseData.department,
        course_code: courseData.course_code,
        credit_hours: courseData.credit_hours
      },
      college: courseData.collage
    });

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error generating assessment report:', error);
    return NextResponse.json({
      message: 'Error generating assessment report',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 