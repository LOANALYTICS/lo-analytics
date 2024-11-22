export function generateComparisonHTML(data: any): string {
    const { course1, course2 } = data;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KR Value Comparison Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px;
            }
            .comparison-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            .course-details {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
            }
            .table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .table th, .table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .table th {
                background: #f0f0f0;
            }
            .highlight {
                background: #e6f3ff;
            }
            .kr-value {
                font-size: 1.2em;
                font-weight: bold;
                color: #2563eb;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>KR Value Comparison Report</h1>
        </div>

        <div class="comparison-grid">
            <div class="course-details">
                <h2>Course 1</h2>
                <p>Name: ${course1.details.name}</p>
                <p>Section: ${course1.details.section}</p>
                <p>Academic Year: ${course1.details.academic_year}</p>
                <p>Exam Type: ${course1.details.examType}</p>
                <p>KR-20: <span class="kr-value">${course1.kr.KR_20.toFixed(2)}</span></p>
            </div>
            <div class="course-details">
                <h2>Course 2</h2>
                <p>Name: ${course2.details.name}</p>
                <p>Section: ${course2.details.section}</p>
                <p>Academic Year: ${course2.details.academic_year}</p>
                <p>Exam Type: ${course2.details.examType}</p>
                <p>KR-20: <span class="kr-value">${course2.kr.KR_20.toFixed(2)}</span></p>
            </div>
        </div>

        <table class="table">
            <tr>
                <th>Item Category</th>
                <th>Course 1 Questions</th>
                <th>Course 1 %</th>
                <th>Course 2 Questions</th>
                <th>Course 2 %</th>
            </tr>
            ${generateComparisonRows(course1.kr.groupedItemAnalysisResults, course2.kr.groupedItemAnalysisResults)}
        </table>

        <table class="table">
            <tr>
                <th>Grade</th>
                <th>Course 1 Count</th>
                <th>Course 1 %</th>
                <th>Course 2 Count</th>
                <th>Course 2 %</th>
            </tr>
            ${generateGradeDistributionRows(course1.kr.gradeDistribution, course2.kr.gradeDistribution)}
        </table>
    </body>
    </html>`;
}

function generateComparisonRows(results1: any[], results2: any[]): string {
    const categories = ['Very Easy Questions', 'Easy Questions', 'Good Questions', 
                       'Difficult Questions', 'Very Difficult Questions', 'Poor (Bad) Questions'];
    
    return categories.map(category => {
        const item1 = results1.find(r => r.classification === category) || { questions: [], perc: 0 };
        const item2 = results2.find(r => r.classification === category) || { questions: [], perc: 0 };
        
        return `
            <tr>
                <td>${category}</td>
                <td>${item1.questions.length}</td>
                <td>${Number(item1.perc || 0).toFixed(1)}%</td>
                <td>${item2.questions.length}</td>
                <td>${Number(item2.perc || 0).toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
}

function generateGradeDistributionRows(dist1: any[], dist2: any[]): string {
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
    
    return grades.map(grade => {
        const grade1 = dist1.find(g => g.grade === grade) || { count: 0, studentPercentage: 0 };
        const grade2 = dist2.find(g => g.grade === grade) || { count: 0, studentPercentage: 0 };
        
        return `
            <tr>
                <td>${grade}</td>
                <td>${grade1.count}</td>
                <td>${grade1.studentPercentage}%</td>
                <td>${grade2.count}</td>
                <td>${grade2.studentPercentage}%</td>
            </tr>
        `;
    }).join('');
} 