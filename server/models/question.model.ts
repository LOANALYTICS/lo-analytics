import mongoose from "mongoose"

export interface IQuestion {
    questionBank: mongoose.Types.ObjectId;
    topic: string;
    question: string;
    options: string[];
    correctAnswer: string;
    clos?: number;
    index: number;
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
    },
    index: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

questionSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Question = mongoose.model('Question');
        const lastQuestion = await Question.findOne({
            questionBank: this.questionBank,
            topic: this.topic
        }).sort({ index: -1 });
        
        this.index = lastQuestion ? lastQuestion.index + 1 : 1;
    }
    next();
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema) 