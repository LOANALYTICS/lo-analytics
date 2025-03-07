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
    indirectAssessments: {
        clo: string;
        achievementRate: number;
        benchmark: string;
        achievementPercentage: number;
    }[];
    assessmentResults: {
        type: string;
        mode: string;
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
    cloData: {
        clo: string;
        description: string;
        ploMapping: {
            k: Array<{ [key: string]: boolean }>;
            s: Array<{ [key: string]: boolean }>;
            v: Array<{ [key: string]: boolean }>;
        };
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
            type: Object,
            required: true
        },
        weight: { type: Number, required: true }
    }],
    indirectAssessments: [{
        clo: { type: String, required: true },
        achievementRate: { type: Number, required: true },
        benchmark: { type: String, required: true },
        achievementPercentage: { type: Number, required: true }
    }],
    assessmentResults: [{
        type: { type: String, required: true },
        mode: { type: String, default: 'general' },
        results: [{
            studentId: { type: String, required: true },
            studentName: { type: String, required: true },
            totalScore: {
                correct: { type: Number, required: true },
                total: { type: Number, required: true },
                percentage: { type: Number, required: true },
                marksScored: { type: Number, required: true },
                totalMarks: { type: Number, required: true }
            },
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
        type: Object,
        default: undefined
    },
    cloData: [{
        clo: { type: String, required: true },
        description: { type: String, required: true },
        ploMapping: {
            k: [{ type: Object, required: true }],
            s: [{ type: Object, required: true }],
            v: [{ type: Object, required: true }]
        }
    }]
}, { timestamps: true, strict: false }); 