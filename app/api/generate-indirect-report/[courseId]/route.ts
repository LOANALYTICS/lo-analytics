import { connectToMongoDB } from "@/lib/db";
import { Assessment, Course } from "@/lib/models";
import { NextResponse } from "next/server";
import { generateIndirectAssessmentHTML } from "@/templates/indirect-assessment-report";

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

interface AssessmentData {
    indirectAssessments: {
        clo: string;
        achievementRate: number;
        benchmark: string;
        achievementPercentage: number;
    }[];
}

export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { courseId: string } }
  ) {

    try {
        await connectToMongoDB();
        
        const courseId = params.courseId;

        // Fetch course data
        const courseData = await Course.findOne({ _id: courseId })
            .populate('collage')
            .select('course_name level semister department course_code credit_hours collage')
            .lean() as unknown as CourseData;

        if (!courseData) {
            return NextResponse.json({
                message: 'Course not found',
                status: 'error'
            }, { status: 404 });
        }

        // Fetch assessment data
        const assessment = (await Assessment.findOne({ course: courseId })
            .select('indirectAssessments')
            .lean()) as AssessmentData | null;

        if (!assessment || !assessment.indirectAssessments || assessment.indirectAssessments.length === 0) {
            return NextResponse.json({ 
                message: 'No indirect assessment data found' 
            }, { status: 404 });
        }

        // Generate HTML using the template
        const htmlContent = generateIndirectAssessmentHTML({
            indirectAssessments: assessment.indirectAssessments,
            course: {
                ...courseData,
                coordinator: 'N/A' // Simplified since we don't need this from URL anymore
            },
            college: courseData.collage
        });

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    } catch (error) {
        console.error('Error generating indirect assessment report:', error);
        return NextResponse.json({
            message: 'Error generating indirect assessment report',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 