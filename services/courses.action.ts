"use server";

import Course, { ICourse } from "@/server/models/course";

export async function getCourses(): Promise<any[]> {
    // Using lean() and asserting the return type as ICourse[]
    const courses = await Course.find().lean() as ICourse[];
    return courses.map((course) => ({
        _id: course._id.toString(),
        course_name: course.course_name,
        sem: course.sem,
        department: course.department,
        university_name: course.university_name,
        course_code: course.course_code,
        credit_hours: course.credit_hours,
        level: course.level,
        question_ref: course.question_ref,
        college_name: course.college_name,
        coordinator: course.coordinator,
        academic_year: course.academic_year,
        no_of_question: course.no_of_question,
        no_of_student: course.no_of_student,
        students_withdrawn: course.students_withdrawn,
        student_absent: course.student_absent,
        KR20: course.KR20,
        gender: course.gender,
        createdBy: course.createdBy,
    }));
}

export async function createCourse(course: typeof Course) {
    const newCourse = await Course.create(course);
    return newCourse.toObject(); // Convert Mongoose document to plain object
}

export async function toggleCourseCoordinator(courseId: string, coordinatorId: string): Promise<ICourse | null> {
    const course = await Course.findById(courseId).lean() as ICourse | null;

    if (!course) {
        throw new Error('Course not found');
    }

    const isCoordinatorAdded = course.coordinator.includes(coordinatorId);

    if (isCoordinatorAdded) {
        await Course.findByIdAndUpdate(courseId, {
            $pull: { coordinator: coordinatorId },
        });
    } else {
        await Course.findByIdAndUpdate(courseId, {
            $addToSet: { coordinator: coordinatorId },
        });
    }

    // After modifying, return the updated course as a plain object
    const updatedCourse = await Course.findById(courseId).lean() as ICourse | null;
    return updatedCourse;
}

export async function assignCoordinatorsToCourse(courseId: string, coordinatorIds: string[]): Promise<any> {
    // Find the course by ID and ensure it exists
    const course = await Course.findById(courseId).lean<ICourse>();
    if (!course) {
        throw new Error('Course not found');
    }

    // Update the course by adding the coordinator references to the coordinators array
    await Course.findByIdAndUpdate(courseId, {
        $addToSet: { coordinator: { $each: coordinatorIds } }, // $addToSet avoids duplicate coordinators
    });

    // Fetch the updated course and populate the coordinator references
    const updatedCourse = await Course.findById(courseId).populate('coordinator').lean<ICourse>();

    return {
        course_name: updatedCourse?.course_name,
        coordinator: updatedCourse?.coordinator,
        _id: updatedCourse?._id,
        sem: updatedCourse?.sem,
        department: updatedCourse?.department,
        university_name: updatedCourse?.university_name,
        course_code: updatedCourse?.course_code,
        credit_hours: updatedCourse?.credit_hours,
        level: updatedCourse?.level,
        question_ref: updatedCourse?.question_ref,
        college_name: updatedCourse?.college_name,
        academic_year: updatedCourse?.academic_year,
        no_of_question: updatedCourse?.no_of_question,
        no_of_student: updatedCourse?.no_of_student,
        students_withdrawn: updatedCourse?.students_withdrawn,
        student_absent: updatedCourse?.student_absent,
        // KR20: updatedCourse?.KR20,
        gender: updatedCourse?.gender,
    } || null; // Return the plain JavaScript object directly
}
