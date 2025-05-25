"use server";
import { Course, User } from "@/lib/models";
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

export async function getCoursesTemplatesByRole(userId: string): Promise<any[]> {
  // Step 1: Fetch user role and college
  const user = await User.findById(userId).select('role collage');

  if (!user) {
    throw new Error("User not found");
  }

  let coursesQuery: any = {};

  // Step 2: Build query based on role
  if (user.role === 'admin') {
    // Admin gets all courses — leave coursesQuery empty
  } else if (user.role === 'college_admin') {
    if (!user.collage) {
      return []; // No college assigned
    }
    coursesQuery.college = user.collage;
  } else {
    return []; // Other roles get nothing
  }

  // Step 3: Fetch courses based on the filtered query
  const courses = await courseTemplateModel.find(coursesQuery)
    .populate("college")
    .populate("coordinator", "name")
    .sort({ createdAt: -1 })
    .lean();

  // Step 4: Serialize the response
  return courses.map((course: any) => ({
    _id: course._id.toString(),
    course_name: course.course_name,
    sem: course.sem,
    department: course.department,
    course_code: course.course_code,
    credit_hours: course.credit_hours,
    level: course.level,
    college: course.college ? {
      _id: course.college._id.toString(),
      english: course.college.english
    } : undefined,
    coordinator: Array.isArray(course.coordinator)
      ? course.coordinator.map((coord: any) => ({
        _id: coord._id.toString(),
        name: coord.name
      }))
      : [],
    createdAt: course.createdAt,
    createdBy: course.createdBy ? course.createdBy.toString() : undefined,
  }));
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

  const course = await courseTemplateModel.findById(courseId).lean<typeof courseTemplateModel>();
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
  if (!course) return null;

  return JSON.parse(JSON.stringify({
    _id: course._id.toString(),
    course_name: course.course_name || "",
    sem: course.sem || "",
    department: course.department || "",
    course_code: course.course_code || "",
    credit_hours: course.credit_hours || "",
    level: course.level || "",
    college: course.college || "",
    examType: course.examType || "",
    section: course.section || "",
    academic_year: course.academic_year || "",
    student_withdrawn: course.student_withdrawn || "",
    student_absent: course.student_absent || "",
    // coordinator: course.coordinator || []
  }));
}

interface EditCourseTemplateParams {
  course_name: string;
  sem: number;
  department: string;
  university_name?: string; // Optional if not included in update
  course_code: string;
  credit_hours: string;
  level: number;
  college?: string;
}

export async function editCourseTemplate(courseTemplateId: string, data: EditCourseTemplateParams) {
  try {
    const existingTemplate = await courseTemplateModel.findById(courseTemplateId);
    if (!existingTemplate) {
      throw new Error('CourseTemplate not found');
    }

    // Freeze the original values before any updates
    const original_course_name = existingTemplate.course_name;
    const original_course_code = existingTemplate.course_code;

    const {
      course_name,
      sem,
      department,
      course_code,
      credit_hours,
      level,
    } = data;

    const changes: Partial<{
      course_name: string;
      course_code: string;
      credit_hours: string;
    }> = {};

    if (course_name !== original_course_name) {
      changes.course_name = course_name;
    }

    if (course_code !== original_course_code) {
      changes.course_code = course_code;
    }

    if (credit_hours !== existingTemplate.credit_hours) {
      changes.credit_hours = credit_hours;
    }

    const updated = await courseTemplateModel.findByIdAndUpdate(
      courseTemplateId,
      {
        course_name,
        sem,
        department,
        course_code,
        credit_hours,
        level,
      },
      { new: true }
    );

    if (!updated) {
      throw new Error('Failed to update CourseTemplate');
    }

    if (Object.keys(changes).length > 0) {
      await Course.updateMany(
        {
          course_name: original_course_name,
          course_code: original_course_code,
        },
        {
          $set: changes,
        }
      );
    }

    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error('Error updating CourseTemplate:', error);
    return { success: false, message: error.message };
  }
}


export async function deleteCourseTemplateById(id: string) {
  try {

    const deleted = await courseTemplateModel.findByIdAndDelete(id);

    if (!deleted) {
      return { success: false, message: 'CourseTemplate not found' };
    }

    return { success: true, message: 'CourseTemplate deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting CourseTemplate:', error);
    return { success: false, message: error.message };
  }
}

