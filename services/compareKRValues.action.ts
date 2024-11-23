"use server"
import { KRValue, Course } from '@/lib/models';
import { ICourse } from '@/server/models/course.model';

export async function compareKRValues(courseId1: string, courseId2: string) {
    try {
        const [course1Data, course2Data] = await Promise.all([
            Course.findById(courseId1)
                .select('course_name section academic_year examType krValues')
                .lean<ICourse>(),
            Course.findById(courseId2)
                .select('course_name section academic_year examType krValues')
                .lean<ICourse>()
        ]);

        if (!course1Data?.krValues || !course2Data?.krValues) {
            throw new Error('KR values not found for one or both courses');
        }

        // Fetch the KR values separately
        const [kr1, kr2] = await Promise.all([
            KRValue.findById(course1Data.krValues).lean(),
            KRValue.findById(course2Data.krValues).lean()
        ]);

        if (!kr1 || !kr2) {
            throw new Error('KR values not found for one or both courses');
        }

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
                    kr: JSON.parse(JSON.stringify(kr1))
                },
                course2: {
                    details: {
                        name: course2Data.course_name,
                        section: course2Data.section,
                        academic_year: course2Data.academic_year,
                        examType: course2Data.examType
                    },
                    kr: JSON.parse(JSON.stringify(kr2))
                }
            }
        };
    } catch (error) {
        console.error('Error comparing KR values:', error);
        throw error;
    }
} 