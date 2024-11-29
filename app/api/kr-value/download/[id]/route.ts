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

    const courseData = await Course.findById(params.id)
      .populate('collage')
      .populate('krValues', 'groupedItemAnalysisResults KR_20 gradeDistribution collegeInfo')
    
    if (!courseData || !courseData.krValues) {
      return NextResponse.json(
        { error: "Course or KR Value not found" },
        { status: 404 }
      );
    }

    const collegeInfo = {
      logo: courseData.collage.logo,
      english: courseData.collage.english,
      regional: courseData.collage.regional,
      university: courseData.collage.university
    };

    const course = {
        course_name: courseData.course_name,
        level: courseData.level,
        semister: courseData.semister,
        coordinator: courseData.coordinator,
        course_code: courseData.course_code,
        credit_hours: courseData.credit_hours,
        studentsNumber: courseData.students?.length || 0,
        studentsWithdrawn: courseData.students_withdrawn,
        studentsAbsent: courseData.student_absent,
        studentsAttended: (courseData.students?.length || 0) - (courseData.students_withdrawn + courseData.student_absent),
        studentsPassed: courseData.passedStudents
    };

    const KR20HTML = generateHTML({
        groupedItemAnalysisResults: courseData.krValues.groupedItemAnalysisResults,
        KR_20: courseData.krValues.KR_20,
        segregatedGradedStudents: courseData.krValues.gradeDistribution,
        course: course,
        collegeInfo
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