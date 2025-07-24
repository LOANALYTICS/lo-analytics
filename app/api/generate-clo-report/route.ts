// its a plo file its a plo not clo 
import { connectToMongoDB } from "@/lib/db";
import { Assessment, Course } from "@/lib/models";
import { NextResponse } from "next/server";
import { generateCloReportHTML } from "@/templates/cloReport"; 
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
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    try {
        await connectToMongoDB();
        
        const { searchParams } = new URL(request.url);
        const percentage = Number(searchParams.get('perc')) || 60;
        const courseId = searchParams.get('courseId');
        const academicYear = searchParams.get('academicYear');
        const section = searchParams.get('section');
        const coordinator = searchParams.get('coordinator');
        if (!courseId) {
            return NextResponse.json({ message: 'Assessment ID is required' }, { status: 400 });
        }


        const courseData = await Course.findOne({
          _id: courseId,
          academic_year: academicYear
        })
        .populate('collage')
        .select('course_name level semister department course_code credit_hours collage')
        .lean() as unknown as CourseData;

                // Fetch assessment data with CLO mappings and achievement data
                const assessment = await Assessment.findOne({course: courseId})
                .select('cloData achievementData indirectAssessments')
                .lean() as unknown as { 
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
                };
    



        if (!courseData) {
          return NextResponse.json({
            message: 'Course not found',
            status: 'error'
          }, { status: 404 });
        }
    


        if (!assessment) {
            return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
        }

        // Get achievement data for selected percentage threshold
        const achievementMap = new Map(
            assessment.achievementData[percentage]?.map(item => [item.clo, item.percentageAchieving]) || []
        );

        // Generate HTML using the template with achievement data
        const htmlContent = generateCloReportHTML({
            cloData: assessment.cloData,
            percentage,
            achievementMap,
            course: {
              course_name: courseData.course_name,
              level: courseData.level,
              semister: courseData.semister,
              department: courseData.department,
              course_code: courseData.course_code,
              credit_hours: courseData.credit_hours,
              coordinator: coordinator!
            },
            college: courseData.collage,
            indirectAssessmentData: assessment?.indirectAssessments ? {
                indirectAssessments: assessment.indirectAssessments
            } : undefined
        });

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    }
    catch (error) {
        console.error('Error generating CLO report:', error);
        return NextResponse.json({
            message: 'Error generating CLO report',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
