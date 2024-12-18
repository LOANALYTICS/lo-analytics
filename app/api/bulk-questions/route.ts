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
            const result = await mammoth.extractRawText({
                buffer: buffer
            });
            
            // Ensure proper line breaks and question separation
            let text = result.value
                .replace(/\r\n|\r|\n/g, '\n')  // Normalize line breaks
                .replace(/([A-Za-z0-9])\nQ:/g, '$1\n\nQ:')  // Ensure questions are separated
                .replace(/\n{3,}/g, '\n\n');  // Clean up excessive line breaks
            
            console.log('Extracted text:', text);  // Debug log
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
    
    // First, normalize line endings
    const normalizedContent = content.replace(/\r\n|\r/g, '\n');
    
    // Count how many questions we expect
    const questionCount = (normalizedContent.match(/Q:/g) || []).length;
    console.log('Expected number of questions:', questionCount);

    // Split the content by Q: and process each block
    const blocks = normalizedContent.split('Q:').slice(1);
    
    console.log('Found blocks:', blocks.length);

    blocks.forEach((block, index) => {
        try {
            // Split into lines and clean them
            const lines = block
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length < 3) {
                console.warn(`Block ${index + 1} has insufficient lines:`, block);
                return;
            }

            // Convert text to HTML format
            const questionText = `<p>${lines[0].trim()}</p>`;
            const optionLines = lines.filter(line => !line.toLowerCase().startsWith('clo:'));
            const cloLine = lines.find(line => line.toLowerCase().startsWith('clo:'));
            
            let correctAnswer = '';
            const options: string[] = [];
            let clos: number | undefined;

            // Extract CLO if present
            if (cloLine) {
                const cloValue = cloLine.toLowerCase().replace('clo:', '').trim();
                clos = parseInt(cloValue);
                if (isNaN(clos)) {
                    console.warn(`Invalid CLO value in block ${index + 1}:`, cloLine);
                    clos = undefined;
                }
            }

            // Process options (excluding the first line which is the question and any CLO line)
            optionLines.slice(1).forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('*')) {
                    // Store correct answer in HTML format
                    correctAnswer = `<p>${trimmedLine.substring(1).trim()}</p>`;
                    options.push(correctAnswer);
                } else if (trimmedLine) {
                    // Store options in HTML format
                    options.push(`<p>${trimmedLine}</p>`);
                }
            });

            if (questionText && options.length >= 2 && correctAnswer) {
                questions.push({
                    question: questionText,
                    options,
                    correctAnswer,
                    clos
                });
                console.log(`Successfully parsed question ${index + 1}:`, {
                    question: questionText,
                    clos
                });
            } else {
                console.warn(`Invalid format in block ${index + 1}:`, {
                    questionText,
                    options,
                    correctAnswer,
                    clos
                });
            }
        } catch (error) {
            console.error(`Error parsing block ${index + 1}:`, block);
        }
    });

    console.log(`Successfully parsed ${questions.length} out of ${questionCount} questions`);
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

        // Validate file type with case-insensitive check
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['txt', 'doc', 'docx'].includes(fileExtension || '')) {
            return NextResponse.json({
                error: 'Only .txt, .doc, and .docx files are supported'
            }, { status: 400 });
        }

        try {
            const content = await getTextContent(file);
            console.log('File Content:', content);
            
            if (!content.trim()) {
                return NextResponse.json({ 
                    error: 'The file appears to be empty' 
                }, { status: 400 });
            }

            const parsedQuestions = parseQuestions(content);

            if (!parsedQuestions.length) {
                return NextResponse.json({ 
                    error: 'No valid questions found in the file...' 
                }, { status: 400 });
            }

            // Create questions sequentially instead of using Promise.all
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
                        console.log('Created question:', q.question);
                    } else {
                        console.error('Failed to create question:', q.question);
                    }
                } catch (error) {
                    console.error('Error creating question:', q.question, error);
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
            console.error('File processing error:', error);
            return NextResponse.json({ 
                error: error instanceof Error 
                    ? error.message 
                    : 'Failed to process the file. Please check the file format and try again.'
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ 
            error: 'An unexpected error occurred while processing your request.' 
        }, { status: 500 });
    }
} 