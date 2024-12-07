"use server"

import { QuestionBank } from "@/lib/models"

interface QuestionBankDoc {
    course: string;
    topics: {
        name: string;
        questions: string[];
    }[];
}

export async function getTopics(courseId: string) {
    try {
        const questionBank = await QuestionBank.findOne({ course: courseId }).lean() as QuestionBankDoc | null
        return JSON.parse(JSON.stringify(questionBank?.topics.map(t => t.name) || []))
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function addTopic(courseId: string, topicName: string) {
    try {
        let questionBank = await QuestionBank.findOne({ course: courseId })
        
        if (!questionBank) {
            questionBank = await QuestionBank.create({
                course: courseId,
                topics: [{ name: topicName, questions: [] }]
            })
        } else {
            await QuestionBank.findByIdAndUpdate(
                questionBank._id,
                {
                    $push: {
                        topics: {
                            name: topicName,
                            questions: []
                        }
                    }
                }
            )
        }

        const updatedQuestionBank = await QuestionBank.findOne({ course: courseId }).lean() as QuestionBankDoc | null
        return JSON.parse(JSON.stringify(updatedQuestionBank?.topics.map(t => t.name) || []))
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function updateTopic(courseId: string, oldTopicName: string, newTopicName: string) {
    try {
        const questionBank = await QuestionBank.findOne({ course: courseId })
        if (!questionBank) return false

        await QuestionBank.findByIdAndUpdate(
            questionBank._id,
            {
                $set: {
                    "topics.$[topic].name": newTopicName
                }
            },
            {
                arrayFilters: [{ "topic.name": oldTopicName }]
            }
        )
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

export async function deleteTopic(courseId: string, topicName: string) {
    try {
        const questionBank = await QuestionBank.findOne({ course: courseId })
        if (!questionBank) return false

        await QuestionBank.findByIdAndUpdate(
            questionBank._id,
            {
                $pull: {
                    topics: { name: topicName }
                }
            }
        )
        return true
    } catch (error) {
        console.error(error)
        return false
    }
} 