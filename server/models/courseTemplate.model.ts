// models/CourseTemplate.ts

import mongoose, { Document, Schema, model, models } from 'mongoose';

interface CourseTemplate extends Document {
  _id: string; 
  course_name: string;
  sem: number;
  department: string;
  university_name: string;
  course_code: string;
  credit_hours: string;
  level: number;
  examType: string;
  question_ref?: string;
  college?: string;
  coordinator: string[]; 
  academic_year: Date;
  students_withdrawn: number;
  student_absent: number;
  KR20?: string; 
  gender?: string;
  createdBy: string; 
  permissions: string[];
}

// Define the schema
const CourseTemplateSchema = new Schema<CourseTemplate>({
  course_name: { type: String },
  sem: { type: Number },
  department: { type: String },
  university_name: { type: String },
  course_code: { type: String },
  credit_hours: { type: String },
  level: { type: Number },
  examType: { type: String,},
  question_ref: { type: String },
  college: [{ type: Schema.Types.ObjectId, ref: 'Collage' }],
  coordinator: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  academic_year: { type: Date },
  students_withdrawn: { type: Number },
  student_absent: { type: Number },
  KR20: { type: String },
  gender: { type: String },
});

export default models.CourseTemplate || model<CourseTemplate>('CourseTemplate', CourseTemplateSchema);
