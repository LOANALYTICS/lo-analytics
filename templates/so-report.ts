import { Chart, registerables } from 'chart.js';
import { createCanvas } from 'canvas';

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
                    justify-content: space-between;
                    gap: 20px;
                }
                .chart-container {
                    flex: 0 1 calc(50% - 20px);
                    min-height: 300px;
                    break-inside: avoid;
                    page-break-inside: avoid;
                    page-break-after: auto;
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
                        <div class="chart-container">
                            ${generateGradeDistributionChartHTML(assessmentData, examType)}
                        </div>
                    `).join('')}
                    <!-- New Overall Grade Distribution Chart -->
                    <div class="chart-container">
                        ${generateGradeDistributionChartHTML(overallData, 'Overall')}
                    </div>
                </div>
            </div>
        </body>
    </html>`;
}

function generateGradeDistributionChartHTML(assessmentData: Record<string, GradeCount>, examType: string): string {
    const filteredData = assessmentData[examType]; // Get data for the specific exam

    // Define colors for each grade
    const gradeColors = {
        'A+': 'rgb(0, 102, 204)',
        'A': 'rgb(51, 153, 255)',
        'B+': 'rgb(102, 51, 153)',
        'B': 'rgb(153, 102, 255)',
        'C+': 'rgb(255, 128, 0)',
        'C': 'rgb(255, 178, 102)',
        'D+': 'rgb(255, 51, 51)',
        'D': 'rgb(255, 102, 102)',
        'F': 'rgb(128, 128, 128)'
    };

    const labels = [examType]; // Use the exam type as the label
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

    const total = Object.values(filteredData).reduce<number>((sum, count) => sum + count, 0); // Calculate total

    const datasets = grades.map(grade => ({
        label: grade,
        data: [((filteredData[grade as keyof GradeCount] / total) * 100).toFixed(1)], // Calculate percentage
        backgroundColor: gradeColors[grade as keyof typeof gradeColors],
        barPercentage: 0.8,
        categoryPercentage: 0.9
    }));

    const canvas = createCanvas(1000, 500);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx as unknown as CanvasRenderingContext2D, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                            size: 20
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        },
                        stepSize: 10,
                        font: {
                            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                            size: 20
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                            size: 20
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Grade Distribution Chart',
                    font: {
                        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                        size: 24
                    }
                }
            }
        }
    });

    // Update the percentage labels font
    datasets.forEach((dataset, datasetIndex) => {
        dataset.data.forEach((value, index) => {
            const numValue = parseFloat(value as string);
            const meta = chart.getDatasetMeta(datasetIndex);
            const bar = meta.data[index];
            ctx.fillStyle = 'black';
            ctx.font = "bold 20px 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
            ctx.textAlign = 'center';

            ctx.fillText(
                `${numValue}%`,
                bar.x,
                bar.y - 15
            );
        });
    });

    const chartImage = canvas.toDataURL('image/png');
    chart.destroy();

    return `
        <div class="chart-container">
            <h2 style="text-align: center;">${examType} Grade Distribution Chart</h2>
            <div style="text-align: center;">
                <img src="${chartImage}" alt="${examType} Grade Distribution Chart" style="max-width:100%; height:auto; border: 1px solid #ccc;"/>
            </div>
        </div>
    `;
}
