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

function parseNormalQuestion(lines: string[], cloIndex: number) {
    const questionLines = lines.slice(0, cloIndex + 1);
    const questionText = questionLines
        .join(' ')
        .replace(/Q:/, '')
        .replace(/\(CLO\d+\)/, '')
        .trim();

    return `<p>${questionText}</p>`;
}

function parseListQuestion(lines: string[], cloIndex: number) {
    console.log('Parsing list question. Lines:', lines); // Debug log
    console.log('Raw lines:', lines);
    console.log('CLO index:', cloIndex);
    // Get the main question text (first line)
    const mainQuestion = lines[0].replace(/Q:/, '').trim();
    console.log('Main question:', mainQuestion); // Debug log
    
    // Get list items with more flexible matching
    const listItems = lines
        .slice(1, cloIndex)
        .map(line => {
            console.log('Processing line:', line); // Debug log
            return line;
        })
        .filter(line => {
            // More flexible pattern matching
            const isListItem = 
                /^[ivxIVX]+\.\s+/i.test(line) || // Roman numerals with dot
                /^[ivxIVX]+\)\s+/i.test(line) || // Roman numerals with parenthesis
                /^[0-9]+\.\s+/.test(line) ||     // Numbers with dot
                /^[a-zA-Z]\.\s+/.test(line) ||   // Letters with dot
                /^\([0-9]+\)\s+/.test(line) ||   // Numbers in parentheses
                /^\([a-zA-Z]\)\s+/.test(line);   // Letters in parentheses
            
            console.log('Is list item?', isListItem, 'for line:', line); // Debug log
            return isListItem;
        })
        .map(item => {
            return `<li style="display: block; margin-bottom: 8px;">${item.trim()}</li>`;
        })
        .join('\n');

    console.log('Generated list items HTML:', listItems); // Debug log

    const result = `
        <p>${mainQuestion}</p>
        <ul style="list-style: none; padding-left: 20px; margin-top: 10px;">
            ${listItems}
        </ul>
    `.trim().replace(/\(CLO\d+\)/, '');

    console.log('Final HTML:', result); // Debug log
    return result;
}

function parseTableQuestion(lines: string[], cloIndex: number) {
    // Will implement later
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

            // Get CLO number
            const cloMatch = lines[cloIndex].match(/\(CLO(\d+)\)/);
            if (!cloMatch) return;
            const clos = parseInt(cloMatch[1]);

            // Determine question type and parse accordingly
            let questionText = '';
            const hasTable = lines.some(line => 
                line.includes('\t') || 
                line.match(/\s{3,}/) || 
                line.includes('School grade')
            );
            const hasList = lines.some(line => {
                const trimmedLine = line.trim();
                // Log the line and test result to see what's happening
                const isMatch = /^[ivxIVX]+\.\t/.test(trimmedLine);
                console.log('Lisne:', trimmedLine, 'Is match:', isMatch);
                return isMatch;
            });

            if (hasTable) {
                // Skip table questions for now
                console.log(`Skipping question ${index + 1} - contains table`);
                return;
            } else if (hasList) {
                questionText = parseListQuestion(lines, cloIndex);
            } else {
                questionText = parseNormalQuestion(lines, cloIndex);
            }

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

            if (questionText && options.length >= 2 && correctAnswer) {
                questions.push({ question: questionText, options, correctAnswer, clos });
                console.log(`Successfully parsed question ${index + 1}`);
            }
        } catch (error) {
            console.error(`Error parsing block ${index + 1}:`, error);
        }
    });

    return questions;
}

function convertTableToHtml(tableContent: string[]): string {
    const rows = tableContent.map(line => 
        line.split(/\t|\s{3,}/)
            .filter(Boolean)
            .map(cell => cell.trim())
    );

    let html = '<table class="border-collapse border w-full">';
    
    // Add header
    html += '<thead><tr>';
    rows[0].forEach(header => {
        html += `<th class="border p-2 bg-gray-100">${header}</th>`;
    });
    html += '</tr></thead>';

    // Add body
    html += '<tbody>';
    rows.slice(1).forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td class="border p-2">${cell}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    return html;
}

export async function POST(request: NextRequest) {
    try {
        console.log('Request received');
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