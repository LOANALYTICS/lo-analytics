"use server"

import { QuestionPaper } from "@/lib/models"
import mongoose from "mongoose"

interface GenerateQPInput {
    examName: string
    courseId: string
    topicQuestions: {
        topic: string
        clos: Record<string, number>
        total: number
    }[]
}

export async function createQuestionPaper(input: GenerateQPInput) {
    try {
        const questionPaper = await QuestionPaper.create({
            examName: input.examName,
            course: new mongoose.Types.ObjectId(input.courseId),
            topicQuestions: input.topicQuestions
        })

        return JSON.parse(JSON.stringify(questionPaper))
    } catch (error) {
        console.error('Error creating question paper:', error)
        throw new Error('Failed to create question paper')
    }
} 