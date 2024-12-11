"use server"

import { QuestionBank, Question } from "@/lib/models"
import { TopicData } from '@/types/question-bank'

interface QuestionBankDoc {
    _id: string;
    course: string;
    topics: {
        name: string;
        allowedQuestion: number;
        questions: string[];
    }[];
}

interface Topic {
    name: string;
    allowedQuestion: number;
    questions: string[];
}

export async function getTopics(courseId: string): Promise<(TopicData & { questionCount: number })[]> {
    try {
        const questionBank = await QuestionBank.findOne({ course: courseId }).lean() as QuestionBankDoc | null
        
        if (!questionBank) return []

        const questionCounts = await Promise.all(
            questionBank.topics.map(async (topic: Topic) => {
                const count = await Question.countDocuments({
                    questionBank: questionBank._id,
                    topic: topic.name
                })
                return {
                    name: topic.name,
                    allowedQuestion: topic.allowedQuestion,
                    questionCount: count
                }
            })
        )

        return questionCounts
    } catch (error) {
        console.error(error)
        return []
    }
}

export async function addTopic(courseId: string, topicName: string, allowedQuestion: number = 0): Promise<(TopicData & { questionCount: number })[]> {
    try {
        let questionBank = await QuestionBank.findOne({ course: courseId })
        
        if (!questionBank) {
            questionBank = await QuestionBank.create({
                course: courseId,
                topics: [{ name: topicName, allowedQuestion, questions: [] }]
            })
            return [{ name: topicName, allowedQuestion, questionCount: 0 }]
        }

        // Check if topic already exists (case insensitive)
        const topicExists = questionBank.topics.some(
            (topic: Topic) => topic.name.toLowerCase() === topicName.toLowerCase()
        )

        if (topicExists) {
            throw new Error('Topic already exists')
        }

        questionBank.topics.push({ name: topicName, allowedQuestion, questions: [] })
        await questionBank.save()

        // Return full topic data including questionCount
        const questionCounts = await Promise.all(
            questionBank.topics.map(async (topic: Topic) => {
                const count = await Question.countDocuments({
                    questionBank: questionBank._id,
                    topic: topic.name
                })
                return {
                    name: topic.name,
                    allowedQuestion: topic.allowedQuestion,
                    questionCount: count
                }
            })
        )

        return questionCounts
    } catch (error) {
        console.error('Error adding topic:', error)
        throw error
    }
}

export async function updateTopic(
    courseId: string, 
    oldTopicName: string, 
    newTopicName: string, 
    allowedQuestion: number
): Promise<boolean> {
    try {
        const questionBank = await QuestionBank.findOne({ course: courseId })
        if (!questionBank) return false

        const updateObj: any = { "topics.$[topic].name": newTopicName }
        if (typeof allowedQuestion === 'number') {
            updateObj["topics.$[topic].allowedQuestion"] = allowedQuestion
        }

        // Update topic in QuestionBank
        await QuestionBank.findByIdAndUpdate(
            questionBank._id,
            { $set: updateObj },
            {
                arrayFilters: [{ "topic.name": oldTopicName }]
            }
        )

        // Update topic name in all associated questions
        await Question.updateMany(
            { 
                questionBank: questionBank._id, 
                topic: oldTopicName 
            },
            { 
                $set: { topic: newTopicName } 
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

        // Delete the topic from QuestionBank
        await QuestionBank.findByIdAndUpdate(
            questionBank._id,
            {
                $pull: {
                    topics: { name: topicName }
                }
            }
        )

        // Delete all questions associated with this topic
        await Question.deleteMany({
            questionBank: questionBank._id,
            topic: topicName
        })

        return true
    } catch (error) {
        console.error(error)
        return false
    }
} 