import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
    _id: string;
    course: Schema.Types.ObjectId;
    students: {
        studentId: string;
        studentName: string;
        examResults: {
            examName: string;
            marks: number;
            totalMarks: number;
            date: Date;
        }[];
    }[];
}

export const assessmentSchema = new Schema<IAssessment>({
    course: { 
        type: Schema.Types.ObjectId, 
        ref: 'Course',
        required: true 
    },
    students: [{
        studentId: { type: String, required: true },
        studentName: { type: String, required: true },
        examResults: [{
            examName: { type: String, required: true },
            marks: { type: Number, required: true },
            totalMarks: { type: Number, required: true },
            date: { type: Date, default: Date.now }
        }]
    }]
}, { timestamps: true }); 