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
            studentName: string;
            totalScore: {
                correct: number;
                total: number;
                percentage: number;
                marksScored: number;
                totalMarks: number;
            };
            cloResults: {
                [key: string]: {
                    totalQuestions: number;
                    correctAnswers: number;
                    marksScored: number;
                    totalMarks: number;
                };
            };
        }[];
        questionKeys: {
            questionNumber: string;
            correctAnswer: string;
        }[];
    }[];
    achievementData?: {
        [threshold: string]: Array<{
            clo: string;
            achievementGrade: number;
            percentageAchieving: number;
        }>;
    };
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
            type: Object,
            required: true
        },
        weight: { type: Number, required: true }
    }],
    assessmentResults: [{
        type: { type: String, required: true },
        results: [{
            studentId: { type: String, required: true },
            studentName: { type: String, required: true },
            "totalScore.correct": { type: Number, required: true },
            "totalScore.total": { type: Number, required: true },
            "totalScore.percentage": { type: Number, required: true },
            "totalScore.marksScored": { type: Number, required: true },
            "totalScore.totalMarks": { type: Number, required: true },
            cloResults: {
                type: Object,
                required: true,
                default: {}
            }
        }],
        questionKeys: [{
            questionNumber: { type: String, required: true },
            correctAnswer: { type: String, required: true }
        }]
    }],
    achievementData: {
        type: Map,
        of: [{
            clo: { type: String, required: true },
            achievementGrade: { type: Number, required: true },
            percentageAchieving: { type: Number, required: true }
        }],
        default: undefined
    }
}, { timestamps: true, strict: false }); 