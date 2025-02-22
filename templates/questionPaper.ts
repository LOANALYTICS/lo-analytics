import dayjs from "dayjs";

export function generateQuestionPaperHTML(data: {
    examName: string;
    courseCode: string;
    questions: any[];
    withAnswers?: boolean;
    course: {
        course_name: string;
        level: number;
        semister: number;
        department: string;
        course_code: string;
        credit_hours: string;
        academic_year: string
    };
    college: {
        logo: string;

        english: string;
        regional: string;
        university: string;
    };
    examDate?: string;
}) {
    const questionsHTML = data.questions
        .map(
            (q, index) => `

    <div class="question-container" style="page-break-inside: avoid !important;">
        <div class="question">
            <span style="margin-right: 8px;">Q${index + 1}.</span>
         <div>
    ${q.question}
    <span class="marks" style="font-size: 0;">.</span>
</div>
        </div>
        <div class="options" style="margin-top: -20px;">
            ${q.options
                    .map(
                        (opt: string, idx: number) => `
                        <div class="option-container" style="page-break-inside: avoid !important;">
                <div class="option" >
                    ${opt}
                </div>
                </div>
            `
                    )
                    .join("")}
        </div>
        ${data.withAnswers
                    ? `
            <div class="answer" style="margin-bottom: 10px;">
                Answer: ${String.fromCharCode(65 + q.options.findIndex((opt: string) => opt === q.correctAnswer))}
            </div>
        `
                    : ""
                }
    </div>
`
        )
        .join("");
    let date = new Date()

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
                    font-size: 14px;
                    margin: 0;
                }
            .header { text-align: center; margin-bottom: 30px; }
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
                line-height: 1.2;
             
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
                    font-weight: bold;
                    display: flex;
                    align-items: flex-start;
                }
                .question-number {
                    margin-right: 8px;
                }
          
                .options {
                    padding-left: 25px;
                    color: #444343;
                    font-weight: 400;
                    display: flex;
        flex-direction: column;
                }
                         .option-container {
        display: inline-block;
        break-inside: avoid;
        page-break-inside: avoid; /* Fallback for older browsers */
        width: 100%; /* Ensure it takes full width to avoid breaking within */
    }
                .option {
            
                    line-height: 0.7 !important;
                }
            
                .answer {
                  margin-top: -5px;
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
                .course-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .detail-item {
            display: flex;
            gap: 5px;
            font-size: 12px;
          }
          .detail-label {
            font-weight: bold;
            white-space: nowrap;
          }
        .logo { max-width: 100%; height: auto; }
        .course_title_container{
        text-align: center;
        
        }
        .course_title_container h2{
        font-size: 24px;
        font-weight: bold;
        }
        .course_title_container p{
        font-size: 20px;
        }
        .marks_container_container{
        height: 60px;
        width: fit-content;
        margin-left: auto;
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 16px;
        font-weight: bold;
    
        
        }
        .marks_container{
        height: 40px;
        width: 90px;
        text-align: center;
        font-size: 12px;
        font-weight: bold;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 30px;
        border: 1px solid #ddd;
        }
        .student_info{
        display: flex; 
        gap: 10px; 
        margin-bottom: 30px; 
        border-radius: 5px; 
        border: 1px solid #ddd;
        padding-left: 10px;
        }
            </style>
        </head>



        <body>

           


           
             <div class="header">
                <img src="${data.college.logo}" alt="College Logo" class="logo">

                <div class="course_title_container" >
                    <h2>${data.course.course_name}</h2>
                    <p>${data.examName} ${data.course.academic_year}</p>
                </div>
            
                <div class="student_info"">
                    <span class="detail-label" style="width: 100px; text-align: start;">Student Name:</span> <div class="student_name_space" style="height: 30px; width: 100%; "></div>
                </div>
                <div class="student_info" >
                    <span class="detail-label" style="width: 100px; text-align: start;">Student ID:</span> <div class="student_name_space" style="height: 30px; width: 100%; "></div>
                </div>
             



              <div class="course-details">
                <div class="detail-item">
                  <span class="detail-label">Date:</span> ${dayjs(date).format('DD-MM-YYYY')}
                </div>

                
                <div class="detail-item">
                  <span class="detail-label">Course Code:</span> ${data.course.course_code}
                </div>
         
                <div class="detail-item">
                  <span class="detail-label">Academic Year:</span> ${data.course.academic_year}
                </div>

                   <div class="detail-item">
                  <span class="detail-label">Level:</span> ${data.course.level}
                </div>
 
                <div class="detail-item">
                  <span class="detail-label">Credit Hours:</span> ${data.course.credit_hours + 'Hours'}
                </div>
              </div>
              <div class="marks_container_container">
                <p style="margin-left: auto; margin-top: -16px;">Marks:</p>
                <div class="marks_container">
               
                </div>
              </div>


              
            
            </div>


            
            <div class="questions no-break-class">
                ${questionsHTML}
            </div>
            <div class="footer" style="text-align: center; margin-top: 40px;">
                <p style="font-size: 16px; font-weight: bold;">Best of Luck</p>
            </div>
        </body>
        </html>
    `;
}
