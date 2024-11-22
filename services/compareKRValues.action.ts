"use server"
import { type KRValue, Course } from '@/lib/models';

export async function compareKRValues(courseId1: string, courseId2: string) {
    try {
        const [course1Data, course2Data] = await Promise.all([
            Course.findById(courseId1)
                .populate<{ krValues: typeof KRValue[] }>('krValues')
                .select('course_name section academic_year examType krValues')
                .lean<{ krValues: typeof KRValue[]; course_name: string; section: string; academic_year: string; examType: string }>(),
            Course.findById(courseId2)
                .populate<{ krValues: typeof KRValue[] }>('krValues')
                .select('course_name section academic_year examType krValues')
                .lean<{ krValues: typeof KRValue[]; course_name: string; section: string; academic_year: string; examType: string }>()
        ]);

        if (!course1Data?.krValues?.length || !course2Data?.krValues?.length) {
            throw new Error('KR values not found for one or both courses');
        }

        // Get the latest KR value for each course
        const kr1 = JSON.parse(JSON.stringify(course1Data.krValues[course1Data.krValues.length - 1]));
        const kr2 = JSON.parse(JSON.stringify(course2Data.krValues[course2Data.krValues.length - 1]));

        return {
            success: true,
            data: {
                course1: {
                    details: {
                        name: course1Data.course_name,
                        section: course1Data.section,
                        academic_year: course1Data.academic_year,
                        examType: course1Data.examType
                    },
                    kr: kr1
                },
                course2: {
                    details: {
                        name: course2Data.course_name,
                        section: course2Data.section,
                        academic_year: course2Data.academic_year,
                        examType: course2Data.examType
                    },
                    kr: kr2
                }
            }
        };
    } catch (error) {
        console.error('Error comparing KR values:', error);
        throw error;
    }
} 