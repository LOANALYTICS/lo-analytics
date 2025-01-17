"use server"

import mongoose from "mongoose"
import Question from '@/server/models/question.model';
import { Course, QuestionBank, QuestionPaper } from "@/lib/models";
import courseTemplateModel from "@/server/models/courseTemplate.model";
import { getTopics } from "./question-bank.service";
import { generateDistributionReportHTML } from "@/templates/distributionReport";

interface GenerateQPInput {
    examName: string
    courseId: string
    topicQuestions: {
        topic: string
        clos: Record<string, number>
        total: number
    }[]
}

interface QuestionOrder {
    questionId: mongoose.Types.ObjectId;
    orderNumber: number;
}

interface TopicQuestionCount {
    topic: string;
    remainingAllowed: number;
    originalAllowed: number;
}

interface TopicQuestion {
    topic: string;
    total: number;
}

interface QuestionBankTopic {
    name: string;
    allowedQuestion: number;
}

interface FilteredPapersResponse {
    success: boolean;
    data: any[];
}

export async function createQuestionPaper(input: GenerateQPInput,userId: string,academicYear: string) {
    try {
        const course = await Course.findOne({ _id: input.courseId })
        if(!course) {
            throw new Error('Course not found');
        }
        const courseTemplate = await courseTemplateModel.findOne({ course_code: course.course_code });

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
        const selectedQuestions = [];

        for (const topicQuestion of input.topicQuestions) {
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

        const questionPaperSaved = await QuestionPaper.create({
            academicYear: academicYear,
            examName: input.examName,
            course: new mongoose.Types.ObjectId(input.courseId),
            topicQuestions: input.topicQuestions,
            QuestionsOrder: finalQuestions.map((question, index) => ({
                questionId: question._id,
                orderNumber: index + 1,
                clo: question.clos
            })),
            createdBy: new mongoose.Types.ObjectId(userId)
        })

        return JSON.parse(JSON.stringify(questionPaperSaved))
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

        // 2. Get all questions from QuestionsOrder
        const questionIds = questionPaper.QuestionsOrder.map((q: QuestionOrder) => q.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });

        // 3. Map questions in order (they're already in 1,2,3,4... sequence)
        const orderedQuestions = questionPaper.QuestionsOrder
            .map((order: QuestionOrder) => {
                const question = questions.find(q => q._id.toString() === order.questionId.toString());
                return {
                    questionNumber: order.orderNumber,
                    question: question.question,
                    options: question.options,
                    correctAnswer: withAnswers ? question.correctAnswer : undefined,
                    topic: question.topic,
                    clo: question.clos
                };
            });

        return {
            examName: questionPaper.examName,
            courseCode: questionPaper.course.course_code,
            questions: orderedQuestions
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

export async function getPaperDetails(courseId: string, academicYear: string): Promise<TopicQuestionCount[]> {
    try {
        // 1. Get all question papers for this course and academic year
        const existingPapers = await QuestionPaper.find({
            course: new mongoose.Types.ObjectId(courseId),
            academicYear: academicYear
        }).populate('course');

        // If no previous papers exist, return original allowed questions
        if (!existingPapers.length) {
            const questionBank = await QuestionBank.findOne({
                course: new mongoose.Types.ObjectId(courseId)
            });

            if (!questionBank) {
                throw new Error('Question bank not found');
            }

            return questionBank.topics.map((topic: QuestionBankTopic) => ({
                topic: topic.name,
                remainingAllowed: topic.allowedQuestion,
                originalAllowed: topic.allowedQuestion
            }));
        }

        // Rest of the existing logic for when there are previous papers
        const courseTemplate = await courseTemplateModel.findOne({
            course_code: existingPapers[0]?.course?.course_code
        });

        const questionBank = await QuestionBank.findOne({
            course: new mongoose.Types.ObjectId(courseTemplate?._id)
        });

        // 3. Calculate used questions per topic
        const usedQuestions: Record<string, number> = {};
        
        existingPapers.forEach(paper => {
            paper.topicQuestions.forEach((topicQ: TopicQuestion) => {
                if (!usedQuestions[topicQ.topic]) {
                    usedQuestions[topicQ.topic] = 0;
                }
                usedQuestions[topicQ.topic] += topicQ.total;
            });
        });

        // 4. Calculate remaining allowed questions for each topic
        const topicCounts: TopicQuestionCount[] = questionBank.topics.map((topic: QuestionBankTopic) => {
            const used = usedQuestions[topic.name] || 0;
            return {
                topic: topic.name,
                remainingAllowed: Math.max(0, topic.allowedQuestion - used),
                originalAllowed: topic.allowedQuestion
            };
        });

        return topicCounts;

    } catch (error) {
        console.error('Error getting paper details:', error);
       return []
    }
}

export async function getFilteredQuestionPapers(courseCode: string, academicYear: string): Promise<FilteredPapersResponse> {
    try {
        // Find the course directly by course code
        const course = await Course.findOne({ course_code: courseCode });
        if (!course) {
            return {
                success: false,
                data: []
            };
        }

        // Get question papers matching the criteria
        const questionPapers = await QuestionPaper.find({
            course: new mongoose.Types.ObjectId(course._id),
            academicYear: academicYear
        }).populate('course')
        .populate('QuestionsOrder.questionId') 
        .lean();

        return {
            success: true,
            data: JSON.parse(JSON.stringify(questionPapers))
        };

    } catch (error) {
        console.error('Error fetching filtered papers:', error);
        return {
            success: false,
            data: []
        };
    }
}

export const generateDistributionReport = async (courseId: string, courseCode: string, year: string) => {
    try {
        const response = await getFilteredQuestionPapers(courseCode, year);
        const topicsResponse = await getTopics(courseId);
        
        if (!response.data || !topicsResponse) {
            throw new Error('Failed to fetch data');
        }

        const html = generateDistributionReportHTML({
            courseName: courseCode,
            topics: topicsResponse,
            papers: response.data
        });

        return html;
    } catch (error) {
        console.error('Error generating distribution report:', error);
        throw error;
    }
};
