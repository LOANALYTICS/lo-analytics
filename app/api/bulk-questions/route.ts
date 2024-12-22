import { NextRequest, NextResponse } from 'next/server';
import { createQuestion } from '@/services/question-bank/question.service';
import mammoth from 'mammoth';

interface ParsedQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    clos?: number;
}

async function getTextContent(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.name.toLowerCase().endsWith('.txt')) {
            return buffer.toString('utf-8');
        } 
        else if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.convertToHtml({
                buffer: buffer
            });
            
            const htmlContent = result.value;
            
            // Only normalize line breaks and question separators, preserve all HTML
            let text = htmlContent
                .replace(/\r\n|\r|\n/g, '\n')
                .replace(/([A-Za-z0-9])\nQ:/g, '$1\n\nQ:')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            return text;
        }
        throw new Error('Unsupported file type');
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

function parseQuestions(content: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    
    const blocks = content
        .substring(content.indexOf('Q:'))
        .split(/(?=Q:)/)
        .filter(block => block.trim().startsWith('Q:'));
    
    blocks.forEach((block, index) => {
        try {
            const cloMatch = block.match(/\(CLO(\d+)\)/);
            if (!cloMatch) return;
            
            const clos = parseInt(cloMatch[1]);
            
            // Split at CLO and fix HTML structure
            const [beforeCLO, afterCLOPart] = block.split(cloMatch[0]);
            let afterCLO = afterCLOPart;
            
            // Handle question text with table if present
            let questionText = beforeCLO.replace(/^Q:/, '').trim();
            const tableMatch = afterCLO.match(/<table[\s\S]*?<\/table>/);
            
            if (tableMatch) {
                // If there's a table, include it in the question
                questionText = `<p>${questionText}</p>${tableMatch[0]}`;
                // Remove table from afterCLO to not interfere with options
                afterCLO = afterCLO.replace(tableMatch[0], '');
            } else {
                questionText = `<p>${questionText}</p>`;
            }

            // Keep full HTML structure for options
            const options: string[] = [];
            let correctAnswer = '';

            // Match only complete p tags for options
            const optionBlocks = afterCLO.match(/<p>[\s\S]*?<\/p>/g) || [];
            
            optionBlocks.forEach(block => {
                const cleanBlock = block.trim();
                if (cleanBlock.includes('*')) {
                    correctAnswer = cleanBlock.replace('*', '');
                    options.push(correctAnswer);
                } else if (cleanBlock) {
                    options.push(cleanBlock);
                }
            });

            if (questionText && options.length >= 2 && correctAnswer && clos) {
                questions.push({
                    question: questionText,
                    options,
                    correctAnswer,
                    clos
                });
            }
        } catch (error) {
            console.error(`Error parsing block ${index + 1}:`, error);
        }
    });

    return questions;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const courseId = formData.get('courseId') as string;
        const topic = formData.get('topic') as string;

        if (!file || !courseId || !topic) {
            return NextResponse.json({ 
                error: 'File, courseId, and topic are required' 
            }, { status: 400 });
        }

        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['txt', 'doc', 'docx'].includes(fileExtension || '')) {
            return NextResponse.json({
                error: 'Only .txt, .doc, and .docx files are supported'
            }, { status: 400 });
        }

        const content = await getTextContent(file);
        if (!content.trim()) {
            return NextResponse.json({ 
                error: 'The file appears to be empty' 
            }, { status: 400 });
        }

        const parsedQuestions = parseQuestions(content);
        if (!parsedQuestions.length) {
            return NextResponse.json({ 
                error: 'No valid questions found in the file' 
            }, { status: 400 });
        }

        const successfulQuestions = [];
        for (const q of parsedQuestions) {
            try {
                const created = await createQuestion({
                    courseId,
                    topic,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    clos: q.clos
                });
                
                if (created) {
                    successfulQuestions.push(created);
                }
            } catch (error) {
                console.error('Error creating question:', error);
            }
        }

        if (successfulQuestions.length === 0) {
            return NextResponse.json({
                error: 'Failed to create any questions'
            }, { status: 500 });
        }

        return NextResponse.json({
            message: `Successfully created ${successfulQuestions.length} questions`,
            totalParsed: parsedQuestions.length,
            successfullyCreated: successfulQuestions.length,
            questions: successfulQuestions
        });

    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ 
            error: 'An unexpected error occurred while processing your request.' 
        }, { status: 500 });
    }
} 