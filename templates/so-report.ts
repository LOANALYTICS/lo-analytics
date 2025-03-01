import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface GradeCount {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D+': number;
    'D': number;
    'F': number;
}

export function generateSOHTML({
    assessmentData,          // Assessment data for each type
    overallGrades,          // Overall grades across all assessments
    course,                 // Course details
    college                 // College details
}: {
    assessmentData: Record<string, GradeCount>;
    overallGrades: GradeCount;
    course: {
        course_name: string;
        level: number;
        semister: number;
        department: string;
        course_code: string;
        credit_hours: string;
        coordinator: string;
    };
    college: {
        logo: string;
        english: string;
        regional: string;
        university: string;
    };
}) {
    // Calculate overall totals
    const totalStudents: number = Object.values(overallGrades).reduce<number>((sum, count) => sum + count, 0);

    // Wrap overallGrades in an object to match the expected structure
    const overallData = { Overall: overallGrades };

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .h2_class { text-align: center; margin-bottom: 30px;,margin:auto; font-size:16px, font-weight:600 }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 100%; height: auto; }
                table { 
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    margin-bottom: 60px;
                    border: 1px solid black;
                    border-radius: 10px;
                    overflow: hidden;
                }
                th, td { 
                    border: 1px solid black;
                    padding: 8px;
                    text-align: center;
                    font-size: 12px;
                    padding-top: 5px;
                    padding-bottom: 10px;
                }
                th {
                    background-color: #f2f2f2;
                    padding-top: 20px;
                    padding-bottom: 30px;
                }
                .total-col {
                    background-color: #e6e6e6;
                    font-weight: bold;
                }
                .grade-row-group {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                .chart-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .chart-wrapper {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                @page {
                    size: A4;
                    margin: 2cm;
                }
                @media print {
                    .chart-wrapper:nth-child(2n) {
                        page-break-after: always;
                    }
                }
                    .course-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .detail-item {
            display: flex;
            gap: 5px;
            font-size: 14px;
          }
          .detail-label {
            font-weight: bold;
            white-space: nowrap;
          }
            </style>
        </head>
        <body>
            <div class="container">
             <div class="header">
              <img src="${college.logo}" alt="College Logo" class="logo">
               <div class="course-details">

                <div class="detail-item">
                  <span class="detail-label">Department:</span> ${course.department}
                </div>

                <div class="detail-item">
                  <span class="detail-label">Course Code:</span> ${course.course_code}
                </div>

                <div class="detail-item">
                  <span class="detail-label">Course Name:</span> ${course.course_name}
                </div>
                 <div class="detail-item">
                  <span class="detail-label">Credit Hours:</span> ${course.credit_hours + 'Hours'}
                </div>

                  <div class="detail-item">
                  <span class="detail-label">Level:</span> ${course.level || 'NA'}
                </div>

                <div class="detail-item">
                  <span class="detail-label">Semester:</span> ${course.semister === 1 ? "First Semester" : "Second Semester"}
                </div>
                       <div class="detail-item">
                  <span class="detail-label">Course Co-ordinator:</span> ${course.coordinator}
                </div>
                
                
               
              </div>
            </div>
                <h2 style="text-align: center; font-weight: 600; font-size: 16px;">Students Outcome (SO) Report</h2>
                <table>
                    <tr>
                        <th>S.No</th>
                        <th>Assessment Method</th>
                        <th>A+</th>
                        <th>A</th>
                        <th>B+</th>
                        <th>B</th>
                        <th>C+</th>
                        <th>C</th>
                        <th>D+</th>
                        <th>D</th>
                        <th>F</th>
                        <th class="total-col">Total Students</th>
                    </tr>
                    ${Object.entries(assessmentData).map(([type, grades], index) => {
        const total: number = Object.values(grades).reduce<number>((sum, count) => sum + count, 0);
        return `
                            <tbody class="grade-row-group">
                                <tr>
                                    <td rowspan="2">${index + 1}</td>
                                    <td rowspan="2">${type}</td>
                                    <td>${grades['A+']}</td>
                                    <td>${grades['A']}</td>
                                    <td>${grades['B+']}</td>
                                    <td>${grades['B']}</td>
                                    <td>${grades['C+']}</td>
                                    <td>${grades['C']}</td>
                                    <td>${grades['D+']}</td>
                                    <td>${grades['D']}</td>
                                    <td>${grades['F']}</td>
                                    <td class="total-col" rowspan="2">${total}</td>
                                </tr>
                                <tr>
                                    <td>${((grades['A+'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['A'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['B+'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['B'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['C+'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['C'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['D+'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['D'] / total) * 100).toFixed(0)}%</td>
                                    <td>${((grades['F'] / total) * 100).toFixed(0)}%</td>
                                </tr>
                            </tbody>`;
    }).join('')}
                    <tr>
                        <td colspan="2" rowspan="2" style="text-align: right; font-weight: bold;">Overall Total</td>
                        <td>${overallGrades['A+']}</td>
                        <td>${overallGrades['A']}</td>
                        <td>${overallGrades['B+']}</td>
                        <td>${overallGrades['B']}</td>
                        <td>${overallGrades['C+']}</td>
                        <td>${overallGrades['C']}</td>
                        <td>${overallGrades['D+']}</td>
                        <td>${overallGrades['D']}</td>
                        <td>${overallGrades['F']}</td>
                        <td class="total-col" rowspan="2">${totalStudents}</td>
                    </tr>
                    <tr>
                     
                        <td>${((overallGrades['A+'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['A'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['B+'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['B'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['C+'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['C'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['D+'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['D'] / totalStudents) * 100).toFixed(0)}%</td>
                        <td>${((overallGrades['F'] / totalStudents) * 100).toFixed(0)}%</td>
                    </tr>
                </table>
                <div class="chart-grid">
                    ${Object.keys(assessmentData).map(examType => `
                        <div class="chart-wrapper">
                            ${generateGradeDistributionChartHTML(assessmentData, examType)}
                        </div>
                    `).join('')}
                    <div class="chart-wrapper">
                        ${generateGradeDistributionChartHTML(overallData, 'Overall')}
                    </div>
                </div>
            </div>
        </body>
    </html>`;
}

function generateGradeDistributionChartHTML(assessmentData: Record<string, GradeCount>, examType: string): string {
    const filteredData = assessmentData[examType];
    const total = Object.values(filteredData).reduce<number>((sum, count) => sum + count, 0);

    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
    const values = grades.map(grade => 
        ((filteredData[grade as keyof GradeCount] / total) * 100).toFixed(1)
    );

    const width = 460;
    const height = 300;
    const margin = {
        left: 40,
        right: 30,
        top: 40,
        bottom: 60
    };
    const barWidth = 32;
    const spacing = 14;
    const chartHeight = height - margin.top - margin.bottom;

    const bars = grades.map((grade, i) => {
        const value = Number(values[i]);
        const x = margin.left + (i * (barWidth + spacing));
        const barHeight = (value * 2); // Scale height to match y-axis
        const y = height - margin.bottom - barHeight;

        return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                  fill="${getColorForGrade(grade)}" />
            <text x="${x + barWidth/2}" y="${y-10}" text-anchor="middle">${value}%</text>
            <text x="${x + barWidth/2}" y="${height - margin.bottom + 20}" text-anchor="middle">${grade}</text>
        `;
    }).join('');

    // Y-axis starts at left margin
    const yAxis = Array.from({length: 11}, (_, i) => {
        const y = height - margin.bottom - (i * (chartHeight/10));
        return `
            <line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" 
                  stroke="#eee" stroke-width="1" />
            <text x="${margin.left - 10}" y="${y + 5}" text-anchor="end">${i * 10}</text>
        `;
    }).join('');

    // Add legend at bottom
    const legendItems = grades.map((grade, i) => {
        const x = margin.left + (i * 35);
        return `
            <rect x="${x}" y="${height - 25}" width="10" height="10" fill="${getColorForGrade(grade)}" />
            <text x="${x + 15}" y="${height - 17}" font-size="10">${grade}</text>
        `;
    }).join('');

    return `
        <div class="chart-wrapper">
            <svg width="${width}" height="${height}">
                <text x="${width/2}" y="30" text-anchor="middle" font-weight="bold">
                    ${examType} Grade Distribution
                </text>
                ${yAxis}
                ${bars}
                ${legendItems}
            </svg>
        </div>
    `;
}

function getColorForGrade(grade: string): string {
    switch (grade) {
        case 'A+': 
            return '#1a4b99'; // Dark matte blue
        case 'A':
            return '#3366cc'; // Medium matte blue
        case 'B+':
            return '#6b5b95'; // Dark matte purple
        case 'B':
            return '#8b7cb7'; // Medium matte purple  
        case 'C+':
            return '#d17b46'; // Dark matte orange
        case 'C':
            return '#e69a73'; // Medium matte orange
        case 'D+':
            return '#993333'; // Dark matte red
        case 'D':
            return '#cc4444'; // Medium matte red
        case 'F':
            return '#800000'; // Deep matte red
        default:
            return '#666666';
    }
}