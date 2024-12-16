import mongoose from "mongoose"

export interface IQuestion {
    questionBank: mongoose.Types.ObjectId;
    topic: string;
    question: string;
    options: string[];
    correctAnswer: string;
    clos?: number;
    createdAt: Date;
    updatedAt: Date;
}

export const questionSchema = new mongoose.Schema({
    questionBank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionBank',
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: String,
        required: true
    },
    clos: {
        type: Number,
        required: false,
  
    }
}, {
    timestamps: true
})

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema) 