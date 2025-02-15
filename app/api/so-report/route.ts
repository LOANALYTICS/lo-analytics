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
        const coordinator = searchParams.get('coordinator');
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

        // For individual assessment grades - keep as is
        assessment.assessmentResults.forEach((result) => {
            const { type, results } = result;
            assessmentData[type] = {
                'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
            };

            results.forEach((student) => {
                const percentage = (student.totalScore.marksScored / student.totalScore.totalMarks) * 100;
                
                if (percentage >= 95) assessmentData[type]['A+']++;
                else if (percentage >= 90) assessmentData[type]['A']++;
                else if (percentage >= 85) assessmentData[type]['B+']++;
                else if (percentage >= 80) assessmentData[type]['B']++;
                else if (percentage >= 75) assessmentData[type]['C+']++;
                else if (percentage >= 70) assessmentData[type]['C']++;
                else if (percentage >= 65) assessmentData[type]['D+']++;
                else if (percentage >= 60) assessmentData[type]['D']++;
                else assessmentData[type]['F']++;
            });
        });

        // For overall grades - track by studentId only, but validate it's a number
        const overallScores = new Map<string, { scored: number, total: number }>();

        assessment.assessmentResults.forEach(result => {
            result.results.forEach(({ studentId, studentName, totalScore }) => {
                // Use the field that's actually a numeric ID
                const actualStudentId = /^\d+$/.test(studentId) ? studentId : studentName;
                
                const current = overallScores.get(actualStudentId) || { scored: 0, total: 0 };
                overallScores.set(actualStudentId, {
                    scored: current.scored + totalScore.marksScored,
                    total: current.total + totalScore.totalMarks
                });
            });
        });

        // console.log("Student Scores:", Array.from(overallScores.entries()).map(([id, scores]) => ({
        //     studentId: id,
        //     totalScored: scores.scored,
        //     totalPossible: scores.total,
        //     percentage: ((scores.scored / scores.total) * 100).toFixed(2) + '%'
        // })));

        // Calculate overall grade distribution
        const overallStudentGrades = {
            'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
        };

        overallScores.forEach((scores) => {
            const percentage = (scores.scored / scores.total) * 100;
          
            
            if (percentage >= 95) overallStudentGrades['A+']++;
            else if (percentage >= 90) overallStudentGrades['A']++;
            else if (percentage >= 85) overallStudentGrades['B+']++;
            else if (percentage >= 80) overallStudentGrades['B']++;
            else if (percentage >= 75) overallStudentGrades['C+']++;
            else if (percentage >= 70) overallStudentGrades['C']++;
            else if (percentage >= 65) overallStudentGrades['D+']++;
            else if (percentage >= 60) overallStudentGrades['D']++;
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
                credit_hours: courseData.credit_hours,
                coordinator: coordinator!
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
