import { connectToMongoDB } from "@/lib/db";
import { Assessment, Course } from "@/lib/models";
import { NextResponse } from "next/server";
import { IAssessment } from "@/server/models/assessment.model";
import { generateSOHTML } from "@/templates/so-report";

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

interface GradeCount {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D+': number;
    'D': number;
    'F': number;
}

export async function GET(request: Request) {
    try {
        await connectToMongoDB();
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const academicYear = searchParams.get('academicYear');
        if (!courseId) {
            return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
        }
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
      

        const assessment = await Assessment.findOne({ course: courseId })
            .select('assessmentResults')
            .lean() as unknown as IAssessment;

        if (!assessment) {
            return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
        }

        // Prepare data for HTML generation
        const assessmentData: Record<string, GradeCount> = {};
        const overallStudentGrades: GradeCount = {
            'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
        };

        // Create a map to store total marks for each student across all types
        const studentTotalMarks: Map<string, { scored: number, total: number }> = new Map();

        assessment.assessmentResults.forEach((result: IAssessment['assessmentResults'][0]) => {
            const { type, results } = result;
            assessmentData[type] = {
                'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
            };

            results.forEach((student: IAssessment['assessmentResults'][0]['results'][0]) => {
                const { totalScore, studentId } = student;
                const percentage = totalScore.percentage;

                // Update individual assessment grades
                if (percentage >= 95) assessmentData[type]['A+']++;
                else if (percentage >= 90) assessmentData[type]['A']++;
                else if (percentage >= 85) assessmentData[type]['B+']++;
                else if (percentage >= 80) assessmentData[type]['B']++;
                else if (percentage >= 75) assessmentData[type]['C+']++;
                else if (percentage >= 70) assessmentData[type]['C']++;
                else if (percentage >= 65) assessmentData[type]['D+']++;
                else if (percentage >= 60) assessmentData[type]['D']++;
                else assessmentData[type]['F']++;

                // Accumulate total marks for each student
                const currentTotal = studentTotalMarks.get(studentId) || { scored: 0, total: 0 };
                studentTotalMarks.set(studentId, {
                    scored: currentTotal.scored + totalScore.marksScored,
                    total: currentTotal.total + totalScore.totalMarks
                });
            });
        });

        // Calculate overall grades based on accumulated marks
        studentTotalMarks.forEach(({ scored, total }) => {
            const overallPercentage = (scored / total) * 100;
            
            if (overallPercentage >= 95) overallStudentGrades['A+']++;
            else if (overallPercentage >= 90) overallStudentGrades['A']++;
            else if (overallPercentage >= 85) overallStudentGrades['B+']++;
            else if (overallPercentage >= 80) overallStudentGrades['B']++;
            else if (overallPercentage >= 75) overallStudentGrades['C+']++;
            else if (overallPercentage >= 70) overallStudentGrades['C']++;
            else if (overallPercentage >= 65) overallStudentGrades['D+']++;
            else if (overallPercentage >= 60) overallStudentGrades['D']++;
            else overallStudentGrades['F']++;
        });

        // Generate HTML using the template
        const htmlContent = generateSOHTML({
            assessmentData,
            overallGrades: overallStudentGrades,
            course: {
                course_name: courseData.course_name,
                level: courseData.level,
                semister: courseData.semister,
                department: courseData.department,
                course_code: courseData.course_code,
                credit_hours: courseData.credit_hours
              },
              college: courseData.collage,}
        );

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
