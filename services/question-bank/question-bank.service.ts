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
            return [topicName]
        }

        // Check if topic already exists (case insensitive)
        const topicExists = questionBank.topics.some(
            (topic: { name: string }) => topic.name.toLowerCase() === topicName.toLowerCase()
        )

        if (topicExists) {
            throw new Error('Topic already exists')
        }

        questionBank.topics.push({ name: topicName, questions: [] })
        await questionBank.save()

        return questionBank.topics.map((topic: { name: string }) => topic.name)
    } catch (error) {
        console.error('Error adding topic:', error)
        throw error
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