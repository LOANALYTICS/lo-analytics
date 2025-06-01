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
  college: mongoose.Types.ObjectId;
  coordinator: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: any;
}

// Define the schema
const CourseTemplateSchema = new Schema<CourseTemplate>({
  course_name: { type: String, required: true },
  sem: { type: Number, required: true },
  department: { type: String, required: true },
  course_code: { type: String, required: true },
  credit_hours: { type: String, required: true },
  level: { type: Number, required: true },
  college: { type: Schema.Types.ObjectId, ref: 'Collage', required: true },
  coordinator: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default models.CourseTemplate || model<CourseTemplate>('CourseTemplate', CourseTemplateSchema);
