import { connectToMongoDB } from "@/lib/db";
import { KRValue, Course } from "@/lib/models";
import { generateHTML } from "@/services/KR20GenerateHTML";
import { NextRequest, NextResponse } from 'next/server';

type Props = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: any
) {
    console.log(params,"params", request);
  try {
    await connectToMongoDB();

    const krValue = await KRValue.findOne({ courseId: params.id });
    const courseData = await Course.findById(params.id);
    
    if (!krValue || !courseData) {
      return NextResponse.json(
        { error: "KR Value or Course not found" },
        { status: 404 }
      );
    }

    const course = {
        course_name: courseData.course_name,
        level: courseData.level,
        semister: courseData.semister,
        coordinator: courseData.coordinator,
        course_code: courseData.course_code,
        credit_hours: courseData.credit_hours,
        studentsNumber: courseData.no_of_student,
        studentsWithdrawn: courseData.students_withdrawn,
        studentsAbsent: courseData.student_absent,
        studentsAttended: courseData.no_of_student - (courseData.students_withdrawn + courseData.student_absent),
        studentsPassed: courseData.passedStudents
    };

    const KR20HTML = generateHTML({
        groupedItemAnalysisResults: krValue.groupedItemAnalysisResults,
        KR_20: krValue.KR_20,
        segregatedGradedStudents: krValue.gradeDistribution,
        course: course,
        collegeInfo: krValue.collegeInfo
    });

    // Return HTML content with proper headers
    return new NextResponse(KR20HTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="kr20-analysis.html"'
      }
    });

  } catch (error) {
    console.error('Error in KR Value download:', error);
    return NextResponse.json(
      { error: "Failed to fetch KR Value" },
      { status: 500 }
    );
  }
} 