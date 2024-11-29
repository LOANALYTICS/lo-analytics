// app/api/createCourseTemplate/route.ts

import courseTemplateModel from '@/server/models/courseTemplate.model';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check for existing course with same name or code in the same college
    const existingCourse = await courseTemplateModel.findOne({
      $and: [
        { college: body.college },
        {
          $or: [
            { course_name: body.course_name },
            { course_code: body.course_code }
          ]
        }
      ]
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this name or code already exists in this college" },
        { status: 409 }
      );
    }

    const course = await courseTemplateModel.create(body);
    return NextResponse.json(course, { status: 201 });

  } catch (error) {
    console.error("Error creating course template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
