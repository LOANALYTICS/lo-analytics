// models/Course.ts

import  { Document, Schema, model, models } from 'mongoose';

export interface IStudent {
  id: string;
  studentId: string;
  studentName: string;
}

export interface ICourse extends Document {
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
  academic_year: String;
  students_withdrawn: number;
  student_absent: number;
  KR20?: string; 
  gender?: string;
  createdBy?: typeof Schema.Types.ObjectId; 
  permissions: string[];
  students: IStudent[];
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
  examType: { type: String, required: true },
  question_ref: { type: String },
  college: [{ type: Schema.Types.ObjectId, ref: 'Collage' }],
  coordinator: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  academic_year: { type: String },
  students_withdrawn: { type: Number },
  student_absent: { type: Number },
  KR20: { type: String },
  gender: { type: String },
  students: [{
    id: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Use existing model if already compiled, otherwise create a new one
export default models.Course || model<ICourse>('Course', CourseSchema);
