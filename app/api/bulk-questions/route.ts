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
            
            // Process the HTML content
            const htmlContent = result.value;
            console.log('Raw HTML from mammoth:', htmlContent);  // Debug log

            // Convert HTML to our format while preserving structure
            let text = htmlContent
                // Preserve list structure
                .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (_, list) => {
                    return list.replace(/<li[^>]*>(.*?)<\/li>/g, 'i. $1\n');
                })
                // Convert other HTML to text
                .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n')
                .replace(/<[^>]+>/g, '')  // Remove any other HTML tags
                .replace(/\r\n|\r|\n/g, '\n')  // Normalize line breaks
                .replace(/([A-Za-z0-9])\nQ:/g, '$1\n\nQ:')  // Ensure questions are separated
                .replace(/\n{3,}/g, '\n\n')  // Clean up excessive line breaks
                .trim();

            console.log('Processed text:', text);  // Debug log
            return text;
        }
        throw new Error('Unsupported file type');
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

function parseNormalQuestion(lines: string[], cloIndex: number): string {
    // Get all lines up to CLO line
    const questionLines = lines.slice(0, cloIndex + 1);
    const questionText = questionLines
        .join(' ')
        .replace(/Q:/, '')
        .replace(/\(CLO\d+\)/, '')
        .trim();

    return `<p>${questionText}</p>`;
}

function parseListQuestion(lines: string[], cloIndex: number): string {
    // Get main question (first line)
    const mainQuestion = lines[0].replace(/Q:/, '').trim();
    
    // Get list items (up to and including CLO line if it's part of list)
    const listItems = lines
        .slice(1)  // Start from second line
        .filter(line => {
            // Include line if it's a list item or if it's the CLO line and starts with list marker
            return line.match(/^[ivxIVX]+\./) || 
                   (line.includes('(CLO') && line.match(/^[ivxIVX]+\./));
        })
        .map(item => {
            // Remove CLO marker if present but keep the list item text
            return `<li>${item.replace(/\(CLO\d+\)/, '').trim()}</li>`;
        })
        .join('\n');

    return `
        <p>${mainQuestion}</p>
        <ol class="list-roman">
            ${listItems}
        </ol>
    `.trim();
}

function parseTableQuestion(lines: string[], cloIndex: number): string {
    // Will implement table parsing later
    return '';
}

function parseQuestions(content: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const blocks = content
        .substring(content.indexOf('Q:'))
        .split(/(?=Q:)/)
        .filter(block => block.trim().startsWith('Q:'));
    
    blocks.forEach((block, index) => {
        try {
            const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
            const cloIndex = lines.findIndex(line => line.includes('(CLO'));
            
            if (cloIndex === -1) return;

            const cloMatch = lines[cloIndex].match(/\(CLO(\d+)\)/);
            if (!cloMatch) return;

            const clos = parseInt(cloMatch[1]);
            const hasList = lines.some(line => line.match(/^[ivxIVX]+\./));
            
            let questionText = hasList 
                ? parseListQuestion(lines, cloIndex)
                : parseNormalQuestion(lines, cloIndex);

            // Process options (everything after CLO)
            let options: string[] = [];
            let correctAnswer = '';
            
            for (let i = cloIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('*')) {
                    correctAnswer = `<p>${line.substring(1).trim()}</p>`;
                    options.push(correctAnswer);
                } else {
                    options.push(`<p>${line.trim()}</p>`);
                }
            }

            if (questionText && options.length >= 2 && correctAnswer && clos) {
                questions.push({ question: questionText, options, correctAnswer, clos });
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