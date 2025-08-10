import { connectToMongoDB } from "@/lib/db";
import { Course } from "@/lib/models";
import { generateHTML } from "@/services/KR20GenerateHTML";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest, { params }: any) {
  const userInformationCookie = request.cookies.get("userInformation")?.value;

  if (!userInformationCookie) {
    return NextResponse.json(
      { error: "User information not found" },
      { status: 401 }
    );
  }

  const userInformation = JSON.parse(userInformationCookie);

  try {
    await connectToMongoDB();

    const courseData = await Course.findById(params.id)
      .populate("collage")
      .populate(
        "krValues",
        "groupedItemAnalysisResults section KR_20 gradeDistribution collegeInfo studentsAttended studentsPassed createdBy"
      );

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
      university: courseData.collage.university,
    };

    const course = {
      course_name: courseData.course_name,
      academicYear: courseData.academic_year,
      level: courseData.level,
      section: courseData.section,
      semister: courseData.semister,
      coordinator: userInformation.name,
      coordinatorRole:userInformation?.role,
      isClgAdminNCoodirnator: userInformation?._id === courseData?.createdBy?.toString(),
      course_code: courseData.course_code,
      credit_hours: courseData.credit_hours,
      studentsNumber: courseData.students?.length || 0,
     
      
      studentsPassed: courseData.passedStudents,
    };

    const KR20HTML = generateHTML({
      groupedItemAnalysisResults:
        courseData.krValues.groupedItemAnalysisResults,
      KR_20: courseData.krValues.KR_20,
      segregatedGradedStudents: courseData.krValues.gradeDistribution,
      course: course,
      studentsAttended: courseData.krValues.studentsAttended,
      studentsPassed: courseData.krValues.studentsPassed,
      collegeInfo,
    });

    // • Return HTML content with proper headers
    return new NextResponse(KR20HTML, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": 'attachment; filename="kr20-analysis.html"',
      },
    });
  } catch (error) {
    // • Log any errors that occur during the process
    console.error("Error in KR Value download:", error);
    return NextResponse.json(
      { error: "Failed to fetch KR Value" },
      { status: 500 }
    );
  }
}
