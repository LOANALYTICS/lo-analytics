export function generateQuestionPaperHTML(data: {
    examName: string;
    courseCode: string;
    questions: any[];
    withAnswers?: boolean;
}) {
    const questionsHTML = data.questions.map((q, index) => `
        <div class="question-container">
            <div class="question">
                <span class="question-number">${index + 1}.</span>
                ${q.question}
                <span class="marks">[CLO${q.clo}]</span>
            </div>
            <div class="options">
                ${q.options.map((opt: string, idx: number) => `
                    <div class="option" data-letter="${String.fromCharCode(65 + idx)})">
                        ${opt}
                    </div>
                `).join('')}
            </div>
            ${data.withAnswers ? `
                <div class="answer">
                    Answer: ${q.correctAnswer}
                </div>
            ` : ''}
        </div>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${data.examName}</title>
            <style>
                @page {
                    size: A4;
                    margin: 2cm;
                }
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.4;
                    font-size: 12px;
                    margin: 0;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .course-code {
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                .question-container {
                    margin-bottom: 25px;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                }
                .question-container:first-of-type {
                    margin-top: 0;
                }
                .question-container + .question-container {
                    margin-top: 0;
                }
                .question {
                    margin-bottom: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                }
                .question-number {
                    margin-right: 8px;
                }
                .marks {
                    font-weight: normal;
                    font-style: italic;
                    font-size: 0.9em;
                    color: #666;
                }
                .options {
                    padding-left: 25px;
                    page-break-inside: avoid !important;
                }
                .option {
                    margin-bottom: 8px;
                    page-break-inside: avoid !important;
                    display: flex;
                }
                .option::before {
                    content: attr(data-letter);
                    margin-right: 8px;
                    flex-shrink: 0;
                }
                .answer {
                    margin-top: 5px;
                    padding-left: 30px;
                    color: #22c55e;
                    font-weight: bold;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                table, th, td {
                    border: 1px solid #000;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f3f4f6;
                }
                .questions {
                    display: block;
                    margin: 0;
                    padding: 0;
                }
                @media print {
                    .question-container {
                        margin-top: 0 !important;
                        padding-top: 0 !important;
                    }
                    div {
                        margin-top: 0 !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${data.examName}</div>
                <div class="course-code">Course Code: ${data.courseCode}</div>
                ${data.withAnswers ? '<div class="answer-key">(Answer Key)</div>' : ''}
            </div>
            <div class="questions">
                ${questionsHTML}
            </div>
        </body>
        </html>
    `;
} 