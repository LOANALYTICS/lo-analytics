'use server'

import { Assessment, Course } from "@/lib/models";
import { revalidatePath } from "next/cache";

type Student = {
    id: string;
    studentId: string;
    studentName: string;
}

interface AssessmentDoc {
    _id: string;
    course: string;
    students: {
        studentId: string;
        studentName: string;
        examResults: any[];
    }[];
}

interface CourseDoc {
    _id: string;
    academic_year: string;
}

export async function updateAssessmentStudents(courseId: string, students: Student[]) {
    try {
        console.log('Updating assessment students:', students);

        // Find existing assessment or create new one
        let assessment = await Assessment.findOne({ course: courseId });

        if (!assessment) {
            // If no assessment exists for this course, create one
            assessment = await Assessment.create({
                course: courseId,
                students: students.map(student => ({
                    studentId: student.studentId,
                    studentName: student.studentName,
                    examResults: [] // Initialize empty exam results
                }))
            });
        } else {
            // Update existing assessment's students
            assessment = await Assessment.findOneAndUpdate(
                { course: courseId },
                {
                    $set: {
                        students: students.map(student => ({
                            studentId: student.studentId,
                            studentName: student.studentName,
                            examResults: [] // Preserve existing exam results if any
                        }))
                    }
                },
                { new: true, upsert: true }
            ).lean();
        }

        if (!assessment) {
            throw new Error('Failed to update assessment');
        }

        revalidatePath('/courses');
        
        return {
            success: true,
            message: 'Students updated successfully',
            data: JSON.parse(JSON.stringify(assessment))
        };

    } catch (error) {
        console.error('Error updating assessment students:', error);
        throw new Error('Failed to update students');
    }
} 

export async function getAssessmentStudents(courseId: string) {
    try {
        const assessment = await Assessment.findOne({ course: courseId }).lean() as unknown as AssessmentDoc;

        if (!assessment) {
            return {
                success: true,
                message: 'No students found',
                data: []
            };
        }

        const transformedStudents = assessment.students.map(student => ({
            id: student.studentId,
            studentId: student.studentId,
            studentName: student.studentName
        }));

        return {
            success: true,
            message: 'Students fetched successfully',
            data: JSON.parse(JSON.stringify(transformedStudents))
        };

    } catch (error) {
        console.error('Error fetching assessment students:', error);
        throw new Error('Failed to fetch students');
    }
}

// Function to check if assessment exists for a course
export async function getAssessmentByCourse(courseId: string) {
    try {
        const assessment = await Assessment.findOne({ course: courseId }).lean();
        
        return {
            success: true,
            exists: !!assessment,
            data: JSON.parse(JSON.stringify(assessment))
        };
    } catch (error) {
        console.error('Error checking assessment:', error);
        throw new Error('Failed to check assessment');
    }
} 

type AssessmentPlan = {
    id: string;
    type: string; 
    clos: {
        [key: string]: number[];
    };
    weight: number;
}

export async function updateAssessmentPlans(courseId: string, academicYear: string, assessments: AssessmentPlan[]) {
    try {
        console.log('Updating assessment plans:', assessments, academicYear,courseId);
        const course = await Course.findOne({_id: courseId, academic_year: academicYear}).lean() as unknown as CourseDoc;
        if (!course) {
            throw new Error('Course not found or students not configured');
        }

    

        // Update existing assessment
        const assessment = await Assessment.findOneAndUpdate(
            { course: courseId },
            { $set: { assessments: assessments } },
            { new: true }
        ).lean();

        if (!assessment) {
            return {
                success: false,
                message: 'Assessment not found for this course',
                data: null
            };
        }

        return {
            success: true,
            message: 'Assessment plans updated successfully',
            data: JSON.parse(JSON.stringify(assessment))
        };

    } catch (error) {
        console.error('Error updating assessment plans:', error);
        throw new Error('Failed to update assessment plans');
    }
} 

