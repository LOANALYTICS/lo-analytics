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
            // college_name: course.college,
            // Handle coordinator (which is an array of objects) and convert _id to string
            coordinator: course.coordinator
                ? course.coordinator.map((coordinator: any) => ({
                      _id: coordinator._id.toString(), // Convert each coordinator's ObjectId to string
                      name: coordinator.name, // Assuming you want other fields like name
                  }))
                : [],
            academic_year: course.academic_year,
            students_withdrawn: course.students_withdrawn,
            student_absent: course.student_absent,
            gender: course.gender,
            createdBy: course.createdBy ? course.createdBy.toString() : undefined, // Convert createdBy ObjectId to string if present
        };

        return serializedCourse;
    });
}

// Define the input type for course creation
type CreateCourseInput = {
  course_name: string;
  course_code: string;
  credit_hours: string;
  department: string;
  examType: string;
  semister: string;
  level: string;
  section: string;
  collage: string;
  academic_year: string;
  student_withdrawn: string;
  student_absent: string;
}

export async function createCourse(course: CreateCourseInput) {
    const newCourse = await Course.create(course);
    return newCourse.toObject();
}



