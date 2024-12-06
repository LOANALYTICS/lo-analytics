"use server";
import { ICourse } from "@/server/models/course.model";
import courseTemplateModel from "@/server/models/courseTemplate.model";

export async function getCoursesTemplates(): Promise<any[]> {
    // Fetch courses and populate both college and coordinator
    const courses = await courseTemplateModel.find()
        .populate("college")
        .populate("coordinator", "name")  // Add coordinator population
        .lean() as any[];

    return courses.map((course) => {
        const serializedCourse: any = {
            _id: course._id.toString(),
            course_name: course.course_name,
            sem: course.sem,
            department: course.department,
            course_code: course.course_code,
            credit_hours: course.credit_hours,
            level: course.level,
            college: {
                _id: course.college._id.toString(),
                english: course.college.english
            },
            // Add coordinator serialization
            coordinator: course.coordinator
                ? course.coordinator.map((coord: any) => ({
                    _id: coord._id.toString(),
                    name: coord.name
                }))
                : [],
            createdBy: course.createdBy ? course.createdBy.toString() : undefined,
        };

        return serializedCourse;
    });
}




export async function createCourseTemplates(course: typeof courseTemplateModel) {
    const newCourse = await courseTemplateModel.create(course);
    return newCourse.toObject(); // Convert Mongoose document to plain object
}

export async function toggleCourseCoordinator(courseId: string, coordinatorId: string): Promise<ICourse | null> {
    const course = await courseTemplateModel.findById(courseId).lean() as any | null;

    if (!course) {
        throw new Error('Course not found');
    }

    const isCoordinatorAdded = course.coordinator.includes(coordinatorId);

    if (isCoordinatorAdded) {
        await courseTemplateModel.findByIdAndUpdate(courseId, {
            $pull: { coordinator: coordinatorId },
        });
    } else {
        await courseTemplateModel.findByIdAndUpdate(courseId, {
            $addToSet: { coordinator: coordinatorId },
        });
    }

    const updatedCourse = await courseTemplateModel.findById(courseId).lean() as any | null;
    return updatedCourse;
}

export async function assignCoordinatorsToCourse(courseId: string, coordinatorIds: string[]): Promise<any> {

    const course = await courseTemplateModel.findById(courseId).lean< typeof courseTemplateModel>();
    if (!course) {
        throw new Error('Course not found');
    }

    await courseTemplateModel.findByIdAndUpdate(courseId, {
        $set: { coordinator: coordinatorIds }, 
    });

    const updatedCourse = await courseTemplateModel.findById(courseId).populate('coordinator').lean<ICourse>();


    return updatedCourse ? true : false; 
}

export async function getCoordinatorCourseTemplates(userId: string): Promise<any[]> {
    const courses = await courseTemplateModel.find({
        coordinator: userId
    }).lean() as any[];

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
        // coordinator: course.coordinator, // Keep as array of strings
        academic_year: course.academic_year,
        students_withdrawn: course.students_withdrawn,
        student_absent: course.student_absent,
        gender: course.gender,
        // createdBy: course.createdBy ? course.createdBy.toString() : undefined,
    }));
}

export async function getCourseTemplateById(id: string) {
    const course = await courseTemplateModel.findById(id).lean() as any;
    console.log(course, "course")
    if (!course) return null;

    return {
        _id: course._id.toString(),
        course_name: course.course_name || "",
        sem: course.sem || "",
        department: course.department || "",
        course_code: course.course_code || "",
        credit_hours: course.credit_hours || "",
        level: course.level || "",
        examType: course.examType || "",
        section: course.section || "",
        academic_year: course.academic_year || "",
        student_withdrawn: course.student_withdrawn || "",
        student_absent: course.student_absent || "",
        // coordinator: course.coordinator || []
    };
}

