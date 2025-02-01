"use server";
import { Course } from '@/lib/models';
import  { ICourse } from '@/server/models/course.model';
import { Types } from 'mongoose';
import { NextResponse } from 'next/server';

export async function getCourses(): Promise<any[]> {
    // Fetch courses and populate the coordinators
    const courses = await Course.find().populate('coordinator').lean() as unknown as ICourse[];

    return courses.map((course) => {
        const serializedCourse: any = {
            _id: course._id.toString(), // Convert the main course ObjectId to string
            course_name: course.course_name,
            semister: course.semister,
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
        
            section: course.section,
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
  semister: number;
  level: number;
  section: string;
  collage: string;
  academic_year: string;
  createdBy: string;
}

export async function createCourse(data: CreateCourseInput) {
    try {
        // Check for exact duplicate (same academic year, semester, examType, AND section)
        const exactDuplicate = await Course.findOne({
            course_name: data.course_name,
            academic_year: data.academic_year,
            semister: data.semister,
            examType: data.examType,
            section: data.section
        });

        if (exactDuplicate) {
            return {
                success: false,
                error: `A course already exists for ${data.academic_year} semester ${data.semister} with exam type ${data.examType} and section ${data.section}`
            };
        }

        // If all validations pass, create the course
        const course = await Course.create({
            course_name: data.course_name,
            course_code: data.course_code,
            credit_hours: data.credit_hours,
            department: data.department,
            examType: data.examType,
            semister: data.semister,
            level: data.level,
            section: data.section,
            collage: data.collage,
            academic_year: data.academic_year,
            createdBy: data.createdBy
        });

        const plainCourse = course.toObject();
        return {
            success: true,
            data: {
                ...plainCourse,
                _id: plainCourse._id.toString(),
                createdBy: plainCourse.createdBy?.toString(),
                collage: plainCourse.collage?.toString()
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

type Student = {
  id: string;
  studentId: string;
  studentName: string;
}

export async function updateCourseStudents(courseId: string, students: Student[]) {
  try {

    console.log(students, 'students')
    const updatedCourse = await Course.findByIdAndUpdate(
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

export async function getCoursesByCreator(userId: string): Promise<any> {
    try {
        // Convert string ID to ObjectId and find courses
        const courses = await Course.find({ 
            createdBy: new Types.ObjectId(userId) 
        })
        .lean() as unknown as ICourse[];

        // Serialize the courses similar to getCourses
        // return courses.map((course) => ({
        //     _id: course._id.toString(),
        //     course_name: course.course_name,
        //     semister: course.semister,
        //     department: course.department,
        //     university_name: course.university_name,
        //     course_code: course.course_code,
        //     credit_hours: course.credit_hours,
        //     level: course.level,
        //     question_ref: course.question_ref,
        //     coordinator: course.coordinator
        //         ? course.coordinator.map((coordinator: any) => ({
        //               _id: coordinator._id.toString(),
        //               name: coordinator.name,
        //           }))
        //         : [],
        //     academic_year: course.academic_year,
        //     students_withdrawn: course.students_withdrawn,
        //     student_absent: course.student_absent,
        //     section: course.section,
        //     createdBy: course.createdBy ? course.createdBy.toString() : undefined,
        //     students: course.students || [],
        //     examType: course.examType
        // }));
        return {
            success: true,
            message: 'Courses fetched successfully',
            data: courses.map((course) => ({
                _id: course._id.toString(),
                course_name: course.course_name,
                semister: course.semister,
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
             
                section: course.section,
                examType: course.examType,
                krValues: course.krValues !== null ? true : false,
                createdBy: course.createdBy ? course.createdBy.toString() : undefined,
                students: course.students.map((student) => ({
                    id: student.id.toString(),
                    studentId: student.studentId.toString(),
                    studentName: student.studentName
                })) || []
            }))
        }
            
    } catch (error) {
        console.error('Error fetching courses by creator:', error);
        throw new Error('Failed to fetch courses');
    }
}

export async function getCourseById(courseId: string) {
    try {
        const course = await Course.findById(courseId)
            .populate('coordinator')
            .lean() as unknown as ICourse;

        if (!course) {
            return null;
        }

        // Serialize the course similar to other functions
        return {
            _id: course._id.toString(),
            course_name: course.course_name,
            semister: course.semister,
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
       
            section: course.section,
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

export async function getCoursesBySemester(
    semester: number, 
    currentCourseId: string, 
    courseName: string
): Promise<any> {
    try {
        const courses = await Course.find({ 
            semister: semester,
            course_name: courseName, // Add course name filter
            _id: { $ne: currentCourseId } // Exclude the current course
        }).lean() as unknown as ICourse[];

        return {
            success: true,
            message: 'Courses fetched successfully',
            data: courses.map((course) => ({
                _id: course._id.toString(),
                course_name: course.course_name,
                semister: course.semister,
                section: course.section,
                examType: course.examType,
                academic_year: course.academic_year,
                department: course.department,
                course_code: course.course_code
            }))
        };
    } catch (error) {
        console.error('Error fetching courses by semester:', error);
        throw new Error('Failed to fetch courses');
    }
}



export async function migrateKrValuesField() {
    try {
        // First, update the schema to ensure krValues is treated as an ObjectId
        await Course.collection.updateMany(
            { krValues: { $type: "array" } },  // Only update documents where krValues is an array
            [
                {
                    $set: {
                        krValues: {
                            $convert: {
                                input: { $arrayElemAt: ["$krValues", 0] },
                                to: "objectId",
                                onError: null,
                                onNull: null
                            }
                        }
                    }
                }
            ]
        );

        return {
            success: true,
            message: 'Successfully migrated krValues field to ObjectId'
        };
    } catch (error) {
        console.error('Error migrating krValues field:', error);
        return {
            success: false,
            error: 'Failed to migrate krValues field'
        };
    }
}




