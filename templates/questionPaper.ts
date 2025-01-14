export function generateQuestionPaperHTML(data: {
    examName: string;
    courseCode: string;
    questions: any[];
    withAnswers?: boolean;
}) {
    const questionsHTML = data.questions.map((q, index) => `
    <div class="question-container">
        <div class="question">
            <span style="margin-right: 8px;">Q${index + 1}.</span>
         <div>
    ${q.question}
    <span class="marks" style="font-size: 0;">.</span>
</div>
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
                    margin-bottom: 20px;
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
                    // page-break-inside: avoid !important;
                    // break-inside: avoid !important;
                }
                .question-container:first-of-type {
                margin-top: 0;
                padding-top: 0;
            }
                .question-container + .question-container {
                    margin-top: 0;
                    padding-top: 0;
                }
                .question {
                    margin-bottom: 5px;
                    font-weight: bold;
                    display: flex;
                    align-items: flex-start;
                }
                .question-number {
                    margin-right: 8px;
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
                    width: 90%;
                    max-width: 600px;
                    margin: 10px auto;
                    border-collapse: collapse;
                    font-size: 9px;
                    page-break-inside: avoid;
                }
                table, th, td {
                    border: 1px solid #000;
                }
                th, td {
                    padding: 2px 3px;
                    text-align: left;
                    line-height: 1.1;
                    vertical-align: top;
                }
                tr {
                    page-break-inside: avoid;
                }
                th {
                    background-color: #f3f4f6;
                    font-size: 9px;
                    font-weight: bold;
                }
                table[colspan] td, 
                table[colspan] th {
                    padding: 2px 3px;
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
                    .question-container:first-child {
                        margin-top: 0 !important;
                    }
                    .questions > .question-container:not(:first-child) {
                        margin-top: initial;
                    }
                }
                table td {
                    white-space: nowrap;
                }
                table td:first-child {
                    white-space: normal;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">${data.examName}</div>
                <div class="course-code">Course Code: ${data.courseCode}</div>
                ${data.withAnswers ? '<div class="answer-key">(Answer Key)</div>' : ''}
            </div>
            <div class="questions no-break-class">
                ${questionsHTML}
            </div>
        </body>
        </html>
    `;
} 