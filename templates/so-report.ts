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
    college,                // College details
    performanceAnalysis     // Performance analysis data
}: {
    assessmentData: Record<string, GradeCount>;
    overallGrades: GradeCount;
    course: {
        course_name: string;
        level: number;
        section: string;
        academic_year: string;
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
    performanceAnalysis?: {
        result: Array<{
            sNo: number;
            studentId: string;
            studentName: string;
            performance: {
                [examType: string]: {
                    scoreOutOf100: number;
                    zScore: number;
                    performance: string;
                };
            };
        }>;
        metadata: {
            [examType: string]: {
                mean: number;
                stdDev: number;
            };
        };
        overall: {
            mean: number;
            stdDev: number;
        };
    };
}) {
    // Console log the performance analysis data
    // console.log('=== PERFORMANCE ANALYSIS IN SO REPORT ===');
    // console.log(JSON.stringify(performanceAnalysis, null, 2));
    // console.log('=== END PERFORMANCE ANALYSIS ===\n');

    // Calculate overall totals
    const totalStudents: number = Object.values(overallGrades).reduce<number>((sum, count) => sum + count, 0);

    // Wrap overallGrades in an object to match the expected structure
    const overallData = { Overall: overallGrades };

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                /* Basic layout styles - detailed styling handled in AssessmentCard */
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 0;
                }
                .page-break {
                    page-break-before: always;
                }
                .container { 
                    max-width: 100%; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                .h2_class { 
                    text-align: center; 
                    margin: 10px 0;
                    font-size: 1.8em;
                    font-weight:800;
                }
                .page-container {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .content-page {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                .table-chart-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    width: 100%;
                    height: 100%;
                    flex: 1;
                }
                .table-section {
                    width: 100%;
                    flex-shrink: 0;
                }
                .chart-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    flex: 1;
                    min-height: 300px;
                }
                .chart-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .chart-wrapper svg {
                    max-width: 100%;
                    max-height: 100%;
                    width: auto;
                    height: auto;
                }
                /* Color classes for performance levels */
                .low { color: #d32f2f; }
                .average { color: #f57c00; }
                .high { color: #388e3c; }
            </style>
        </head>
        <body>
            <!-- Page 1: Header + Course Details + Performance Analysis Table -->
            <div class="page-container">
                <div class="container">
                    <div class="header">
                        <img src="${college.logo}" alt="College Logo" class="logo">
                        <div class="course-details">
                            <div class="detail-item">
                                <span class="detail-label">Course Code:</span> ${course.course_code}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Course Name:</span> ${course.course_name} (${course.section.charAt(0).toUpperCase() + course.section.slice(1).toLowerCase()})
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Credit Hours:</span> ${course.credit_hours + 'Hours'}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Level:</span> ${course.level || 'NA'}
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Semester:</span> ${course.semister === 1 ? "First Semester" : "Second Semester"} (${course?.academic_year})
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Course Co-ordinator:</span> ${course.coordinator}
                            </div>
                        </div>
                    </div>
                    <h2 class="h2_class">Student Performance Analysis</h2>
                
                ${performanceAnalysis ? `
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th><p>S.No</p></th>
                            <th><p>Student ID</p></th>
                            <th><p>Student Name</p></th>
                            ${Object.keys(performanceAnalysis.metadata).map(examType => `
                                <th><p>${examType}</p></th>
                            `).join('')}
                            <th><p>Overall</p></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${performanceAnalysis.result.map(student => `
                            <tr>
                                <td><p> ${student.sNo}.</p></td>
                                <td><p>${student.studentId}</p></td>
                                <td><p>${student.studentName}</p></td>
                                ${Object.keys(performanceAnalysis.metadata).map(examType => {
        const perf = student.performance[examType];
        if (perf) {
            return `
                                            <td class="performance-cell">
                                                <p class="performance-level ${perf.performance.toLowerCase()}">${perf.performance === 'Average' ? 'Avg' : perf.performance}</p>
                                            </td>
                                        `;
        } else {
            return `<td></td>`;
        }
    }).join('')}
                                ${(() => {
            const overallPerf = student.performance.Overall;
            return `
                                        <td class="performance-cell">
                                            <p class="performance-level ${overallPerf.performance.toLowerCase()}">${overallPerf.performance === 'Average' ? 'Avg' : overallPerf.performance}</p>
                                        </td>
                                    `;
        })()}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
                </div>
            </div>

            <!-- Page 2: SO Report Table and Overall Chart -->
            <div class="page-break page-container">
                <div class="container content-page">
                    <h2 class="h2_class">Students Outcome (SO) Report</h2>
                    
                    <div class="table-chart-container">
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
                                <td colspan="2" rowspan="2" style="text-align: right; font-weight: bold;">Overall</td>
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

                        <div class="chart-section">
                            <div class="chart-wrapper">
                                ${generateGradeDistributionChartHTML(overallData, 'Overall')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${performanceAnalysis ? `
            ` : ''}
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

    // Dynamic sizing - will scale based on available space
    const baseWidth = 900;  // Larger base width
    const baseHeight = 400; // Reasonable base height
    const width = baseWidth;
    const height = baseHeight;
    const margin = {
        left: 70,
        right: 50,
        top: 40,
        bottom: 70
    };
    const barWidth = 50;  // Even wider bars
    const spacing = 25;   // More spacing between bars
    const chartHeight = height - margin.top - margin.bottom;

    const bars = grades.map((grade, i) => {
        const value = Number(values[i]);
        const x = margin.left + (i * (barWidth + spacing));
        const barHeight = (value * chartHeight / 100); // Scale height to match y-axis
        const y = height - margin.bottom - barHeight;

        return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                  fill="${getColorForGrade(grade)}" rx="4" ry="4" stroke="#333" stroke-width="0.5" />
            <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">${value}%</text>
            <text x="${x + barWidth / 2}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="#555">${grade}</text>
        `;
    }).join('');

    // Y-axis starts at left margin
    const yAxis = Array.from({ length: 11 }, (_, i) => {
        const y = height - margin.bottom - (i * (chartHeight / 10));
        return `
            <line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" 
                  stroke="#e0e0e0" stroke-width="1" />
            <text x="${margin.left - 12}" y="${y + 5}" text-anchor="end" font-size="11" fill="#555">${i * 10}</text>
        `;
    }).join('');

    // Add legend at bottom
    const legendItems = grades.map((grade, i) => {
        const x = margin.left + (i * 50);
        return `
            <rect x="${x}" y="${height - 25}" width="12" height="12" fill="${getColorForGrade(grade)}" rx="2" ry="2" />
            <text x="${x + 16}" y="${height - 16}" font-size="10" fill="#333">${grade}</text>
        `;
    }).join('');

    return `
        <div class="chart-wrapper">
            <svg width="${width}" height="${height}">
                <text x="${width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">
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
            return '#28589c'; // Darker blue
        case 'A':
            return '#417ac9'; // Medium blue
        case 'B+':
            return '#7a6aab'; // Darker purple
        case 'B':
            return '#9c8dc2'; // Medium purple  
        case 'C+':
            return '#da8c53'; // Darker orange
        case 'C':
            return '#f0ac7e'; // Medium orange
        case 'D+':
            return '#a84c4c'; // Darker red
        case 'D':
            return '#cc6666'; // Medium red
        case 'F':
            return '#6b0000'; // Very deep red
        default:
            return '#666666';
    }
}