// app/api/createCourseTemplate/route.ts

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import CourseTemplateModel from '../../../../server/models/courseTemplate.model'; // Adjust path as needed

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON body
    const {
      course_name,
      sem,
      department,
      university_name,
      course_code,
      credit_hours,
      level,
      question_ref,
      _id,
      college_name,
      coordinator,
      academic_year,
      no_of_question,
      no_of_student,
      students_withdrawn,
      student_absent,
      KR20,
      gender,
      createdBy,
      
    } = await request.json();

    // Create a new document based on the CourseTemplate model
    const newCourseTemplate = new CourseTemplateModel({
      course_name,
      sem,
      department,
      university_name,
      course_code,
      credit_hours,
      level,
      question_ref,
      _id,
      college_name,
      coordinator,
      academic_year,
      no_of_question,
      no_of_student,
      students_withdrawn,
      student_absent,
      KR20,
      gender,
      createdBy,
    });

    // Save the document to the database
    const savedCourseTemplate = await newCourseTemplate.save();

    // Return success response
    return NextResponse.json(
      {
        message: 'Course Template created successfully',
        data: savedCourseTemplate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course template:', error);
    return NextResponse.json(
      {
        message: 'Error creating course template',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
