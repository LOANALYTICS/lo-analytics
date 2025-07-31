import { NextRequest, NextResponse } from 'next/server';
import { Course, Assessment } from '@/lib/models';
import { connectToMongoDB } from '@/lib/db';

interface CourseData {
  _id: string;
  course_name: string;
  course_code: string;
}

interface AssessmentData {
  cloData: Array<{
    clo: string;
    description: string;
    ploMapping: {
      k: Array<{ [key: string]: boolean }>;
      s: Array<{ [key: string]: boolean }>;
      v: Array<{ [key: string]: boolean }>;
    };
  }>;
  achievementData: {
    [key: string]: Array<{
      clo: string;
      achievementGrade: number;
      percentageAchieving: number;
    }>;
  };
  indirectAssessments?: Array<any>;
}

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB();

    const body = await request.json();
    const { academic_year, semester, section } = body;

    // Console log the received form data
    console.log('Assessment Report Form Data:', body);

    // Build the filter query
    let filterQuery: any = {
      semister: semester,
      academic_year: academic_year,
      examType: "final"
    };

    // Handle section filtering
    if (section === 'all') {
      filterQuery.section = { $in: ['male', 'female'] };
    } else {
      filterQuery.section = section;
    }

    // Get courses with minimal data
    const courses = await Course.find(filterQuery)
      .select('course_name course_code _id')
      .lean() as unknown as CourseData[];

    console.log('Filtered courses:', courses);

    // Get assessment data for each course
    const coursesWithAssessments = await Promise.all(
      courses.map(async (course) => {
        const assessment = await Assessment.findOne({ course: course._id })
          .select('cloData achievementData indirectAssessments')
          .lean() as unknown as AssessmentData | null;

        const courseData = {
          course: {
            course_name: course.course_name,
            course_code: course.course_code
          },
          assessment: assessment ? {
            cloData: assessment.cloData,
            achievementData: assessment.achievementData,
            indirectAssessments: assessment.indirectAssessments
          } : null
        };

        console.log(`Course: ${course.course_name} (${course.course_code})`, courseData);

        return courseData;
      })
    );

    console.log('Total courses with assessments:', coursesWithAssessments.length);

    return NextResponse.json({
      success: true,
      message: 'Assessment report data generated successfully',
      data: {
        courses: coursesWithAssessments,
        count: coursesWithAssessments.length,
        filters: filterQuery
      },
      length: coursesWithAssessments.length,
    });

  } catch (error) {
    console.error('Error processing assessment report request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}