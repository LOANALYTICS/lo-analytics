// models/Course.ts

import  { Document, Schema, model, models } from 'mongoose';

 export interface ICourse extends Document {
  _id: string; 
  course_name: string;
  sem: number;
  department: string;
  university_name: string;
  course_code: string;
  credit_hours: string;
  level: number;
  question_ref?: string;
  college_name?: string;
  coordinator: string[]; 
  academic_year: Date;
  no_of_question: number;
  no_of_student: number;
  students_withdrawn: number;
  student_absent: number;
  KR20?: string; 
  gender?: string;
  createdBy: string; 
  permissions: string[];
}

// Define the schema
const CourseSchema = new Schema<ICourse>({
  course_name: { type: String },
  sem: { type: Number },
  department: { type: String },
  university_name: { type: String },
  course_code: { type: String },
  credit_hours: { type: String },
  level: { type: Number },
  question_ref: { type: String },
  college_name: { type: String },
  coordinator: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  academic_year: { type: Date },
  no_of_question: { type: Number },
  no_of_student: { type: Number },
  students_withdrawn: { type: Number },
  student_absent: { type: Number },
  KR20: { type: String },
  gender: { type: String },
});

// Use existing model if already compiled, otherwise create a new one
export default models.Course || model<ICourse>('Course', CourseSchema);
