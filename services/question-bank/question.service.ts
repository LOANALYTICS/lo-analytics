"use server"

import { Question, QuestionBank } from "@/lib/models"
import mongoose from "mongoose"

interface CreateQuestionInput {
    courseId: string
    topic: string
    question: string
    options: string[]
    correctAnswer: string
    clos?: string
}

export async function createQuestion(input: CreateQuestionInput) {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // Find or create QuestionBank
        let questionBank = await QuestionBank.findOne({ course: input.courseId })
        
        if (!questionBank) {
            questionBank = await QuestionBank.create([{
                course: input.courseId,
                topics: [{
                    name: input.topic,
                    questions: []
                }]
            }], { session })
            questionBank = questionBank[0] // Create returns an array
        } else {
            // Check if topic exists
            const topicExists = questionBank.topics.some((t: { name: string }) => t.name === input.topic)
            if (!topicExists) {
                await QuestionBank.findByIdAndUpdate(
                    questionBank._id,
                    {
                        $push: {
                            topics: {
                                name: input.topic,
                                questions: []
                            }
                        }
                    },
                    { session }
                )
            }
        }

        // Create question
        const question = await Question.create([{
            questionBank: questionBank._id,
            ...input
        }], { session })

        // Add question reference to topic
        await QuestionBank.findByIdAndUpdate(
            questionBank._id,
            {
                $push: {
                    "topics.$[topic].questions": question[0]._id
                }
            },
            {
                arrayFilters: [{ "topic.name": input.topic }],
                session
            }
        )

        await session.commitTransaction()
        return JSON.parse(JSON.stringify(question[0]))
    } catch (error) {
        await session.abortTransaction()
        console.error(error)
        return null
    } finally {
        session.endSession()
    }
}

export async function updateQuestion(questionId: string, input: Partial<CreateQuestionInput>) {
    try {
        const question = await Question.findByIdAndUpdate(
            questionId,
            { $set: input },
            { new: true }
        ).lean()
        
        return JSON.parse(JSON.stringify(question))
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function deleteQuestion(questionId: string, questionBankId: string, topic: string) {
    try {
        await Question.findByIdAndDelete(questionId)
        
        // Remove question reference from QuestionBank
        await QuestionBank.findByIdAndUpdate(
            questionBankId,
            {
                $pull: {
                    "topics.$[topic].questions": questionId
                }
            },
            {
                arrayFilters: [{ "topic.name": topic }]
            }
        )
        
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

export async function getQuestions(questionBankId: string, topic: string) {
    try {
        const questions = await Question.find({
            questionBank: questionBankId,
            topic: topic
        }).lean()
        
        return JSON.parse(JSON.stringify(questions))
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function getQuestionById(questionId: string) {
    try {
        const question = await Question.findById(questionId).lean()
        return JSON.parse(JSON.stringify(question))
    } catch (error) {
        console.error(error)
        return null
    }
} 