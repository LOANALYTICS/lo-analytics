"use server";
import Course, { ICourse } from "@/server/models/course";

export async function getCourses(): Promise<any[]> {
    // Fetch courses and populate the coordinators
    const courses = await Course.find().populate('coordinator').lean() as ICourse[];

    return courses.map((course) => {
        const serializedCourse: any = {
            _id: course._id.toString(), // Convert the main course ObjectId to string
            course_name: course.course_name,
            sem: course.sem,
            department: course.department,
            university_name: course.university_name,
            course_code: course.course_code,
            credit_hours: course.credit_hours,
            level: course.level,
            question_ref: course.question_ref,
            college_name: course.college_name,
            // Handle coordinator (which is an array of objects) and convert _id to string
            coordinator: course.coordinator
                ? course.coordinator.map((coordinator: any) => ({
                      _id: coordinator._id.toString(), // Convert each coordinator's ObjectId to string
                      name: coordinator.name, // Assuming you want other fields like name
                  }))
                : [],
            academic_year: course.academic_year,
            no_of_question: course.no_of_question,
            no_of_student: course.no_of_student,
            students_withdrawn: course.students_withdrawn,
            student_absent: course.student_absent,
            gender: course.gender,
            createdBy: course.createdBy ? course.createdBy.toString() : undefined, // Convert createdBy ObjectId to string if present
        };

        return serializedCourse;
    });
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

    const updatedCourse = await Course.findById(courseId).lean() as ICourse | null;
    return updatedCourse;
}

export async function assignCoordinatorsToCourse(courseId: string, coordinatorIds: string[]): Promise<any> {

    const course = await Course.findById(courseId).lean<ICourse>();
    if (!course) {
        throw new Error('Course not found');
    }

    await Course.findByIdAndUpdate(courseId, {
        $set: { coordinator: coordinatorIds }, 
    });

    const updatedCourse = await Course.findById(courseId).populate('coordinator').lean<ICourse>();


    return updatedCourse ? true : false; 
}

