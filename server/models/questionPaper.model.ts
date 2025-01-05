import mongoose from "mongoose";

export interface IQuestionPaper {
    examName: string;
    course: mongoose.Types.ObjectId;
    topicQuestions: {
        topic: string;
        clos: Record<string, number>;
        total: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export const questionPaperSchema = new mongoose.Schema({
    academicYear: {
        type: String,
    },
    examName: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    topicQuestions: [{
        topic: {
            type: String,
            required: true
        },
        clos: {
            type: Map,
            of: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    QuestionsOrder: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        orderNumber: {
            type: Number,
            required: true
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.models.QuestionPaper || mongoose.model<IQuestionPaper>('QuestionPaper', questionPaperSchema); 