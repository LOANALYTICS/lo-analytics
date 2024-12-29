"use server"

import mongoose from "mongoose"
import Question from '@/server/models/question.model';
import { QuestionBank, QuestionPaper } from "@/lib/models";
import courseTemplateModel from "@/server/models/courseTemplate.model";

interface GenerateQPInput {
    examName: string
    courseId: string
    topicQuestions: {
        topic: string
        clos: Record<string, number>
        total: number
    }[]
}

export async function createQuestionPaper(input: GenerateQPInput,userId: string) {
    try {
        const questionPaper = await QuestionPaper.create({
            examName: input.examName,
            course: new mongoose.Types.ObjectId(input.courseId),
            topicQuestions: input.topicQuestions,
            createdBy: new mongoose.Types.ObjectId(userId)
        })

        return JSON.parse(JSON.stringify(questionPaper))
    } catch (error) {
        console.error('Error creating question paper:', error)
        throw new Error('Failed to create question paper')
    }
}

export async function generateQuestionsByPaperId(questionPaperId: string, withAnswers: boolean) {
    try {
        // 1. Fetch question paper and populate course details
        const questionPaper = JSON.parse(JSON.stringify(await QuestionPaper.findById(questionPaperId)
            .populate('course')
            .lean()));

        if (!questionPaper) {
            throw new Error('Question paper not found');
        }

        // 2. Get course code and fetch course template
        const courseCode = questionPaper?.course?.course_code;
        const courseTemplate = await courseTemplateModel.findOne({ course_code: courseCode });

        if (!courseTemplate) {
            throw new Error('Course template not found');
        }

        // 3. Get question bank for this course
        const questionBank = await QuestionBank.findOne({ 
            course: courseTemplate._id 
        }).populate('topics.questions');

        if (!questionBank) {
            throw new Error('Question bank not found');
        }

        // 4. Generate questions based on requirements
        const selectedQuestions = [];

        for (const topicQuestion of questionPaper.topicQuestions) {
            const topicInBank = questionBank.topics.find((t: any) => t.name === topicQuestion.topic);
            
            if (!topicInBank) {
                console.log(`Topic ${topicQuestion.topic} not found in question bank`);
                continue;
            }

            // Get all questions for this topic with their CLOs
            const topicQuestions = await Question.find({
                _id: { $in: topicInBank.questions },
                topic: topicQuestion.topic
            });

            // Group questions by CLO
            const questionsByCLO = new Map();
            topicQuestions.forEach(q => {
                if (q.clos) {
                    const cloKey = `clo${q.clos}`;
                    if (!questionsByCLO.has(cloKey)) {
                        questionsByCLO.set(cloKey, []);
                    }
                    questionsByCLO.get(cloKey).push(q);
                }
            });

            // Select questions for each CLO
            for (const [clo, requiredCount] of Object.entries(topicQuestion.clos)) {
                const availableQuestions = questionsByCLO.get(clo) || [];
                const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, requiredCount as number);

                if (selected.length < (requiredCount as number)) {
                    console.log(`Warning: Not enough questions for ${clo} in topic ${topicQuestion.topic}. Required: ${requiredCount}, Available: ${selected.length}`);
                }

                selectedQuestions.push(...selected);
            }
        }

        // Randomize final question order
        const finalQuestions = selectedQuestions.sort(() => 0.5 - Math.random());

        // Format questions for PDF
        const formattedQuestions = finalQuestions.map((q, index) => ({
            questionNumber: index + 1,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            topic: q.topic,
            clo: q.clos
        }));

        return {
            examName: questionPaper.examName,
            courseCode,
            questions: formattedQuestions
        };

    } catch (error) {
        console.error('Error generating questions:', error);
        throw new Error('Failed to generate questions');
    }
} 

export async function getQuestionPapers(userId: string) {
    const questionPapers = await QuestionPaper.find({ createdBy: new mongoose.Types.ObjectId(userId) }).populate('course')
    return JSON.parse(JSON.stringify(questionPapers))
}
