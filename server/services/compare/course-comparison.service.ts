import { Types } from 'mongoose';
import {  ICourse } from '../../models/course.model';
import { Course } from '@/lib/models';

interface GroupedCourses {
  byLevel: {
    [key: number]: ICourse[];
  };
  byDepartment: {
    [key: string]: ICourse[];
  };
}

export class CourseComparisonService {
  async compareCourses(
    college: string,
    semester: number,
    examType: string,
    year: string
  ): Promise<GroupedCourses> {
    // Convert string college ID to ObjectId
    const collegeId = new Types.ObjectId(college);

    // Query courses with populated krValues
    const courses = await Course.find({
      collage: collegeId,
      semister: semester,
      examType: examType,
      academic_year: year
    }).populate('krValues');

    // Group courses by level
    const byLevel = courses.reduce((acc, course) => {
      const level = course.level;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(course);
      return acc;
    }, {} as { [key: number]: ICourse[] });

    // Group courses by department
    const byDepartment = courses.reduce((acc, course) => {
      const dept = course.department;
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(course);
      return acc;
    }, {} as { [key: string]: ICourse[] });

    return {
      byLevel,
      byDepartment
    };
  }
}