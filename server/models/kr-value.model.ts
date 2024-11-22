import { Document, Schema } from 'mongoose';

interface IQuestion {
  question: string;
  // Add other question fields if needed
}

interface IGroupedItemAnalysis {
  classification: string;
  questions: IQuestion[];
  perc: number;
}

interface IGradeDistribution {
  grade: string;
  count: number;
  studentPercentage: number;
}

export interface IKRValue extends Document {
  _id: string;
  courseId: Schema.Types.ObjectId;
  KR_20: number;
  groupedItemAnalysisResults: IGroupedItemAnalysis[];
  gradeDistribution: IGradeDistribution[];
  createdAt: Date;
}

export const krValueSchema = new Schema<IKRValue>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  KR_20: {
    type: Number,
    required: true
  },
  groupedItemAnalysisResults: [{
    classification: String,
    questions: [{
      question: String,
    }],
    perc: Number
  }],
  gradeDistribution: [{
    grade: String,
    count: Number,
    studentPercentage: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true }); 