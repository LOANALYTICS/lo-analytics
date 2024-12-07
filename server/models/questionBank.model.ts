import mongoose from "mongoose";

export interface IQuestionBank {
    course: mongoose.Types.ObjectId;
    topics: {
        name: string;
        questions: mongoose.Types.ObjectId[];
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export const questionBankSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseTemplate',
        required: true
    },
    topics: [{
        name: { type: String, required: true },
        questions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }]
    }]
}, {
    timestamps: true
});

export default mongoose.models.QuestionBank || mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema); 