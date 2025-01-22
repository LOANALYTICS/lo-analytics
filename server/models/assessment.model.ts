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
    assessments: {
        id: string;
        type: string;
        clos: {
            [key: string]: number[];  // e.g., clo1: [1, 2]
        };
        weight: number;
    }[];
    assessmentResults: {
        type: string;
        results: {
            studentId: string;
            clos: {
                [key: string]: number;  // cloId: marks
            };
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
    }],
    assessments: [{
        type: { type: String, required: true },
        clos: {
            type: Map,
            of: [Number],
            required: true
        },
        weight: { type: Number, required: true }
    }],
    assessmentResults: [{
        type: { type: String, required: true },
        results: [{
            studentId: { type: String, required: true },
            clos: {
                type: Map,
                of: Number,
                required: true
            }
        }]
    }]
}, { timestamps: true }); 