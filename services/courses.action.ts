"use server";
import courseModel, { ICourse } from '@/server/models/course.model';
import { Types } from 'mongoose';

export async function getCourses(): Promise<any[]> {
    // Fetch courses and populate the coordinators
    const courses = await courseModel.find().populate('coordinator').lean() as ICourse[];

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
            students: course.students || [],
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
  createdBy: string;
}

export async function createCourse(course: CreateCourseInput) {
    const newCourse = await courseModel.create(course);
    return {
        _id: newCourse._id.toString(),
        course_name: newCourse.course_name,
        course_code: newCourse.course_code,
        credit_hours: newCourse.credit_hours,
        department: newCourse.department,
        examType: newCourse.examType,
        semister: newCourse.semister,
    };
}

type Student = {
  id: string;
  studentId: string;
  studentName: string;
}

export async function updateCourseStudents(courseId: string, students: Student[]) {
  try {
    const updatedCourse = await courseModel.findByIdAndUpdate(
      courseId,
      { $set: { students: students } },
      { new: true }
    ).lean();

    if (!updatedCourse) {
      throw new Error('Course not found');
    }

    return {
      success: true,
      message: 'Students updated successfully',
      data: updatedCourse ? true : false
    };
  } catch (error) {
    console.error('Error updating students:', error);
    throw new Error('Failed to update students');
  }
}

export async function getCoursesByCreator(userId: string): Promise<any[]> {
    try {
        // Convert string ID to ObjectId and find courses
        const courses = await courseModel.find({ 
            createdBy: new Types.ObjectId(userId) 
        })
        .lean() as ICourse[];
        console.log(courses,"hello")
        // Serialize the courses similar to getCourses
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
            coordinator: course.coordinator
                ? course.coordinator.map((coordinator: any) => ({
                      _id: coordinator._id.toString(),
                      name: coordinator.name,
                  }))
                : [],
            academic_year: course.academic_year,
            students_withdrawn: course.students_withdrawn,
            student_absent: course.student_absent,
            gender: course.gender,
            createdBy: course.createdBy ? course.createdBy.toString() : undefined,
            students: course.students || [],
            examType: course.examType
        }));
    } catch (error) {
        console.error('Error fetching courses by creator:', error);
        throw new Error('Failed to fetch courses');
    }
}

export async function getCourseById(courseId: string) {
    try {
        const course = await courseModel.findById(courseId)
            .populate('coordinator')
            .lean() as ICourse;

        if (!course) {
            return null;
        }

        // Serialize the course similar to other functions
        return {
            _id: course._id.toString(),
            course_name: course.course_name,
            sem: course.sem,
            department: course.department,
            university_name: course.university_name,
            course_code: course.course_code,
            credit_hours: course.credit_hours,
            level: course.level,
            question_ref: course.question_ref,
            coordinator: course.coordinator
                ? course.coordinator.map((coordinator: any) => ({
                      _id: coordinator._id.toString(),
                      name: coordinator.name,
                  }))
                : [],
            academic_year: course.academic_year,
            students_withdrawn: course.students_withdrawn,
            student_absent: course.student_absent,
            gender: course.gender,
            createdBy: course.createdBy ? course.createdBy.toString() : undefined,
            students: course.students.map((student) => {
                return {
                    id: student.id.toString(),
                    studentId: student.studentId.toString(),
                    studentName: student.studentName
                }
            }) || [],
            examType: course.examType
        };
    } catch (error) {
        console.error('Error fetching course:', error);
        throw new Error('Failed to fetch course');
    }
}



