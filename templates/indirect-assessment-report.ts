import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface IndirectAssessment {
    clo: string;
    achievementRate: number;
    benchmark: string;
    achievementPercentage: number;
}

interface CourseDetails {
    course_name: string;
    level: number;
    semister: number;
    department: string;
    course_code: string;
    credit_hours: string;
    coordinator: string;
}

interface CollegeDetails {
    logo: string;
    english: string;
    regional: string;
    university: string;
}

export function generateIndirectAssessmentHTML({
    indirectAssessments,
    course,
    college,
}: {
    indirectAssessments: IndirectAssessment[];
    course: CourseDetails;
    college: CollegeDetails;
}) {
    const averageRate = indirectAssessments.reduce((sum, assessment) => sum + assessment.achievementRate, 0) / indirectAssessments.length;
    const averagePercentage = indirectAssessments.reduce((sum, assessment) => sum + assessment.achievementPercentage, 0) / indirectAssessments.length;

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                body { 
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container { 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    padding: 20px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                .logo { 
                    max-width: 100%; 
                    height: auto; 
                }
                table { 
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px auto;
                    border: 1px solid black;
                    break-inside: avoid;
                }
                th, td { 
                    border: 1px solid black;
                    padding: 6px;
                    text-align: center;
                    font-size: 12px;
                }
                th { 
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .course-details {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                    border: 1px solid #ddd;
                    padding: 12px;
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
                .chart-container {
                    width: 100%;
                    margin: 40px auto;
                    break-inside: avoid;
                    page-break-before: auto;
                    page-break-after: auto;
                    display: flex;
                    justify-content: center;
                }
                @media print {
                    .table-section {
                        break-inside: avoid;
                        page-break-after: auto;
                    }
                    .chart-container {
                        break-inside: avoid;
                        page-break-before: auto;
                        page-break-after: auto;
                    }
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
                            <span class="detail-label">Credit Hours:</span> ${course.credit_hours} Hours
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Level:</span> ${course.level || 'NA'}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Semester:</span> ${course.semister === 1 ? "First Semester" : "Second Semester"}
                        </div>
                       
                    </div>
                </div>

                <div class="table-section">
                    <h2 style="text-align: center; font-weight: 600; font-size: 16px;">Indirect Assessment Report</h2>

                    <table>
                        <tr>
                            <th>CLOs</th>
                            <th>Achievement Rate</th>
                            <th>Benchmark</th>
                            <th>Achievement Percentage</th>
                        </tr>
                        ${indirectAssessments.map(assessment => `
                            <tr>
                                <td>${assessment.clo}</td>
                                <td>${assessment.achievementRate}</td>
                                <td>${assessment.benchmark}</td>
                                <td>${assessment.achievementPercentage.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                        <tr style="font-weight: bold; background-color: #f2f2f2;">
                            <td>Overall</td>
                            <td>${averageRate.toFixed(1)}</td>
                            <td>80%</td>
                            <td>${averagePercentage.toFixed(1)}%</td>
                        </tr>
                    </table>
                </div>

                <div class="chart-container">
                    ${generateBarChart(indirectAssessments)}
                </div>
            </div>
        </body>
    </html>`;
}

function generateBarChart(assessments: IndirectAssessment[]): string {
    const width = 750;  // Slightly reduced width
    const height = 450; // Increased height to accommodate bottom legend
    const margin = { top: 50, right: 60, bottom: 80, left: 60 }; // Adjusted margins to be equal on left and right
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const barWidth = Math.min(50, (chartWidth / assessments.length) - 15);
    
    // Generate bars
    const bars = assessments.map((assessment, index) => {
        const x = margin.left + (index * (chartWidth / assessments.length)) + ((chartWidth / assessments.length - barWidth) / 2);
        const barHeight = (assessment.achievementPercentage / 100) * chartHeight;
        const y = height - margin.bottom - barHeight;
        
        return `
            <g>
                <rect 
                    x="${x}" 
                    y="${y}" 
                    width="${barWidth}" 
                    height="${barHeight}"
                    fill="#1a4b99"
                />
                <text 
                    x="${x + barWidth/2}" 
                    y="${y - 5}" 
                    text-anchor="middle"
                    font-size="12"
                >${assessment.achievementPercentage.toFixed(1)}%</text>
                <text 
                    x="${x + barWidth/2}" 
                    y="${height - margin.bottom + 20}" 
                    text-anchor="middle"
                    font-size="12"
                >${assessment.clo}</text>
            </g>
        `;
    }).join('');

    // Y-axis with grid lines and labels
    const yAxisTicks = Array.from({length: 11}, (_, i) => i * 10);
    const yAxis = yAxisTicks.map(tick => {
        const y = height - margin.bottom - (tick/100 * chartHeight);
        return `
            <g>
                <line 
                    x1="${margin.left}" 
                    x2="${width - margin.right}" 
                    y1="${y}" 
                    y2="${y}" 
                    stroke="#eee" 
                    stroke-width="1"
                />
                <text 
                    x="${margin.left - 10}" 
                    y="${y + 5}" 
                    text-anchor="end"
                    font-size="12"
                >${tick}.0%</text>
            </g>
        `;
    }).join('');
    
    // Draw the benchmark line at 80%
    const benchmarkY = height - margin.bottom - (0.8 * chartHeight);
    const benchmarkLine = `
        <line 
            x1="${margin.left - 5}" 
            y1="${benchmarkY}" 
            x2="${width - margin.right + 5}" 
            y2="${benchmarkY}" 
            stroke="red" 
            stroke-width="2"
        />
    `;

    // Add background grid
    const gridLines = yAxisTicks.map(tick => {
        const y = height - margin.bottom - (tick/100 * chartHeight);
        return `
            <line 
                x1="${margin.left}" 
                x2="${width - margin.right}" 
                y1="${y}" 
                y2="${y}" 
                stroke="#eee" 
                stroke-width="1"
            />
        `;
    }).join('');
    
    // Add legend at bottom center
    const legendY = height - margin.bottom + 50; // Position below the graph
    const legend = `
        <g transform="translate(${width/2 - 100}, ${legendY})">
            <rect x="0" y="0" width="15" height="15" fill="#1a4b99"/>
            <text x="25" y="12" font-size="12">Achievement</text>
            <line x1="90" y1="7" x2="130" y2="7" stroke="red" stroke-width="2"/>
            <text x="140" y="12" font-size="12">Benchmark</text>
        </g>
    `;

    return `
        <svg width="${width}" height="${height}" style="margin: auto;">
            <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
                </pattern>
            </defs>
            <rect width="${width}" height="${height}" fill="white"/>
            ${gridLines}
            <text 
                x="${width/2}" 
                y="${margin.top - 20}" 
                text-anchor="middle" 
                font-size="14" 
                font-weight="bold"
            >Indirect Assessment</text>
            ${yAxis}
            ${bars}
            ${benchmarkLine}
            ${legend}
        </svg>
    `;
} 