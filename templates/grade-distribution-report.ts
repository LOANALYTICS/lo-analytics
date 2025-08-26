interface GradeData {
    value: number;
    percentage: number;
}

interface GradeDistribution {
    'A': GradeData;
    'B': GradeData;
    'C': GradeData;
    'D': GradeData;
    'F': GradeData;
}

interface CourseSOAverage {
    _id: string;
    course_name: string;
    course_code: string;
    level: number;
    department: string;
    grades: GradeDistribution;
    totalStudents: number;
}

interface GroupTotal {
    totalStudents: number;
    grades: GradeDistribution;
}

interface LevelGroup {
    level: number;
    courses: CourseSOAverage[];
    total: GroupTotal;
    overall: {
        totalPassing: number;
        totalFailing: number;
        overallPassPercentage: string;
        overallFailPercentage: string;
    };
}

interface DepartmentGroup {
    department: string;
    courses: CourseSOAverage[];
    total: GroupTotal;
    overall: {
        totalPassing: number;
        totalFailing: number;
        overallPassPercentage: string;
        overallFailPercentage: string;
    };
}

interface SummaryData {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
    totalStudents: number;
    overallPassing: number;
    overallPassPercentage: string;
    overallFailPercentage: string;
}

interface GradeDistributionData {
    byLevel: LevelGroup[];
    byDepartment: DepartmentGroup[];
    levelSummary: SummaryData;
    departmentSummary: SummaryData;
}

interface ReportParams {
    data: GradeDistributionData;
    academic_year: string;
    semester: number;
    section: string;
    college: {
        logo: string;
        english: string;
        regional: string;
        university: string;
    };
}

type SummaryType = 'level' | 'department';
type TableType = 'summary' | 'detailed';

function generateFrontPage(academic_year: string, semester: number, section: string, college: ReportParams['college']): string {
    return `
        <div class="front-page">
            <div class="front-page-content">
                <div class="logo-container">
                    ${college.logo ? `<img src="${college.logo}" alt="College Logo" class="front-logo"/>` : ''}
                </div>
                <div class="title-container">
                    <h1 class="main-title">Student Grade Report</h1>
                    <div class="report-details">
                        <p><strong>Academic Year:</strong> ${academic_year}</p>
                        <p><strong>Semester:</strong> ${semester}</p>
                        <p><strong>Section:</strong> ${section}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function generateGradeDistributionHTML({
    data,
    academic_year,
    semester,
    section,
    college
}: ReportParams): string {
    const frontPage = generateFrontPage(academic_year, semester, section, college);
    const levelSummary = generateSummaryTable('level', data);
    const levelTables = data.byLevel.map(levelGroup =>
        generateDetailedTable('level', levelGroup)
    ).join('');
    const departmentSummary = generateSummaryTable('department', data);
    const departmentTables = data.byDepartment.map(deptGroup =>
        generateDetailedTable('department', deptGroup)
    ).join('');

    return generateHTMLDocument('Grade Distribution Report', `
        ${frontPage}
        <div class="summary-page">
        <h2 class="section-title">Levels</h2>
            ${levelSummary}
        </div>
        ${levelTables}
        <div class="summary-page">
            <h2 class="section-title">Departments</h2>
            ${departmentSummary}
        </div>
        ${departmentTables}
    `);
}



function generateHTMLDocument(title: string, content: string): string {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 0;
                    font-size: 12px;
                }
                
                .page {
                    width: 100%;
                    padding: 20px;
                    margin: 0 auto;
                    background: white;
                    page-break-after: always;
                    page-break-inside: avoid;
                }
                
                .page:last-child {
                    page-break-after: avoid;
                }
                
                .summary-page {
                    width: 100%;
                    padding: 20px;
                    margin: 0 auto;
                    background: white;
                    page-break-after: always;
                    page-break-inside: avoid;
                }

                .front-page {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    page-break-after: always;
                    page-break-inside: avoid;
                }

                .front-page-content {
                    text-align: center;
                    max-width: 600px;
                    padding: 40px;
                }

                .logo-container {
                    margin-bottom: 40px;
                }

                .front-logo {
                    max-width: 200px;
                    max-height: 200px;
                    object-fit: contain;
                }

                .title-container {
                    margin-bottom: 40px;
                }

                .main-title {
                    font-size: 36px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 30px;
                    text-align: center;
                }

                .report-details {
                    font-size: 18px;
                    line-height: 1.6;
                    color: #555;
                }

                .report-details p {
                    margin: 10px 0;
                }

                .section-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #333;
                    text-align: center;
                    margin: 20px 0;
                    padding: 10px;
                    background-color: #f5f5f5;
                    border-radius: 4px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    border: 2px solid #333;
                }
                
                .summary-table {
                    max-width: 800px;
                    margin: 20px auto;
                }
                
                th, td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                    font-size: 11px;
                    vertical-align: middle;
                }
                
                .summary-table th, .summary-table td {
                    padding: 12px 8px;
                    font-size: 12px;
                }
                
                th {
                    background-color: #add8e6;
                    color: black;
                    font-weight: bold;
                    padding: 12px 8px;
                }
                
                .level-header {
                    background-color: #b5dce9 !important;
                    color: black;
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                }
                
                .header-row {
                    background-color: #b5dce9 !important;
                    color: black;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .dept-name {
                    text-align: left !important;
                    max-width: 200px;
                    word-wrap: break-word;
                }
                
                .course-name-col {
                    text-align: left !important;
                    max-width: 200px;
                    word-wrap: break-word;
                }
                
                .total-row {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                
                .overall-row {
                    background-color: #d0d0d0;
                    font-weight: bold;
                }
                
                .grade-cell {
                    min-width: 60px;
                }
                
                .percentage-row {
                    font-style: italic;
                    background-color: #fff;
                }
                
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .page, .summary-page {
                        width: auto;
                        height: auto;
                        margin: 0;
                        padding: 10mm;
                        box-shadow: none;
                        page-break-after: always;
                        page-break-inside: avoid;
                    }
                    
                    .page:last-child, .summary-page:last-child {
                        page-break-after: avoid;
                    }
                    
                    .summary-page {
                        min-height: auto;
                        display: block;
                    }
                    
                    .front-page {
                        min-height: auto;
                        display: block;
                        height: auto;
                    }
                    
                    /* Remove empty space */
                    .summary-page:empty {
                        display: none;
                    }
                    
                    .page:empty {
                        display: none;
                    }
                    
                    .front-page:empty {
                        display: none;
                    }
                    
                    th {
                        background-color: #add8e6 !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .level-header {
                        background-color: #b5dce9 !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .header-row {
                        background-color: #b5dce9 !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .total-row {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .overall-row {
                        background-color: #d0d0d0 !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    .percentage-row {
                        background-color: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                }
                
                @page {
                    size: A4;
                    margin: 15mm;
                }

                /* Chart styles */
                .chart-container {
                    width: 100%;
                    margin: 20px 0;
                    padding: 15px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }

                .chart-title {
                    text-align: center;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #333;
                }

                .chart-svg {
                    width: 100%;
                    height: auto;
                }

                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: 10px;
                    font-size: 10px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
    </html>`;
}

function generateSummaryTable(type: SummaryType, data: GradeDistributionData): string {
    const isLevel = type === 'level';
    const groups = isLevel ? data.byLevel : data.byDepartment;
    const summary = isLevel ? data.levelSummary : data.departmentSummary;
    const headerLabel = isLevel ? 'Level' : 'Department';

    const tableHtml = `
        <table class="summary-table">
            <thead>
                <tr class="header-row">
                    <th rowspan="2">${headerLabel}</th>
                    <th colspan="5">No/Percentage of Students</th>
                    <th rowspan="2">Total N. of<br>students</th>
                </tr>
                <tr class="header-row">
                    <th>A</th>
                    <th>B</th>
                    <th>C</th>
                    <th>D</th>
                    <th>F</th>
                </tr>
            </thead>
            <tbody>
                ${groups.map(group => {
        const label = isLevel ? `Level ${(group as LevelGroup).level}` : (group as DepartmentGroup).department;
        const nameClass = isLevel ? '' : 'class="dept-name"';
        return `
                    <tr>
                        <td rowspan="2" ${nameClass} style="font-weight: bold;">${label}</td>
                        <td>${group.total.grades.A.value}</td>
                        <td>${group.total.grades.B.value}</td>
                        <td>${group.total.grades.C.value}</td>
                        <td>${group.total.grades.D.value}</td>
                        <td>${group.total.grades.F.value}</td>
                        <td rowspan="2">${group.total.totalStudents}</td>
                    </tr>
                    <tr class="percentage-row">
                        <td>${group.total.grades.A.percentage}%</td>
                        <td>${group.total.grades.B.percentage}%</td>
                        <td>${group.total.grades.C.percentage}%</td>
                        <td>${group.total.grades.D.percentage}%</td>
                        <td>${group.total.grades.F.percentage}%</td>
                    </tr>
                    `;
    }).join('')}
                <tr class="total-row">
                    <td rowspan="2">Total</td>
                    <td>${summary.A}</td>
                    <td>${summary.B}</td>
                    <td>${summary.C}</td>
                    <td>${summary.D}</td>
                    <td>${summary.F}</td>
                    <td rowspan="2">${summary.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td>${summary.totalStudents > 0 ? ((summary.A / summary.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${summary.totalStudents > 0 ? ((summary.B / summary.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${summary.totalStudents > 0 ? ((summary.C / summary.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${summary.totalStudents > 0 ? ((summary.D / summary.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${summary.totalStudents > 0 ? ((summary.F / summary.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr class="overall-row">
                    <td rowspan="2">Overall</td>
                    <td colspan="4">${summary.overallPassing}</td>
                    <td>${summary.F}</td>
                    <td rowspan="2"></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="4">${summary.overallPassPercentage}%</td>
                    <td>${summary.overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>`;

    // Generate chart for summary data + total
    const chartTitle = `Students Grades Distribution (${headerLabel} Summary)`;
    const chartData = [
        ...groups.map(group => {
            const label = isLevel ? `Level ${(group as LevelGroup).level}` : (group as DepartmentGroup).department;
            return {
                label: label,
                grades: group.total.grades
            };
        }),
        // Add overall total as the last bar
        {
            label: 'Total',
            grades: {
                A: { value: summary.A, percentage: summary.totalStudents > 0 ? Number(((summary.A / summary.totalStudents) * 100).toFixed(1)) : 0 },
                B: { value: summary.B, percentage: summary.totalStudents > 0 ? Number(((summary.B / summary.totalStudents) * 100).toFixed(1)) : 0 },
                C: { value: summary.C, percentage: summary.totalStudents > 0 ? Number(((summary.C / summary.totalStudents) * 100).toFixed(1)) : 0 },
                D: { value: summary.D, percentage: summary.totalStudents > 0 ? Number(((summary.D / summary.totalStudents) * 100).toFixed(1)) : 0 },
                F: { value: summary.F, percentage: summary.totalStudents > 0 ? Number(((summary.F / summary.totalStudents) * 100).toFixed(1)) : 0 }
            }
        }
    ];

    const chartHtml = generateGradeDistributionChart(chartTitle, chartData);

    return tableHtml + chartHtml;
}

function generateDetailedTable(type: SummaryType, group: LevelGroup | DepartmentGroup): string {
    const isLevel = type === 'level';
    const headerLabel = isLevel ? `Level ${(group as LevelGroup).level}` : (group as DepartmentGroup).department;

    const tableHtml = `
        <table>
            <colgroup>
                <col style="width: 40px;">
                <col style="width: 200px;">
                <col style="width: 80px;">
                <col style="width: 80px;">
                <col style="width: 80px;">
                <col style="width: 80px;">
                <col style="width: 80px;">
                <col style="width: 100px;">
            </colgroup>
            <thead>
                <tr>
                    <th colspan="2" class="level-header">${headerLabel}</th>
                    <th colspan="5" class="level-header">No/Percentage of Students</th>
                    <th rowspan="2" class="level-header">Total N.<br>of<br>students</th>
                </tr>
                <tr>
                    <th>S<br>No</th>
                    <th>Course Name<br>& Code</th>
                    <th>A</th>
                    <th>B</th>
                    <th>C</th>
                    <th>D</th>
                    <th>F</th>
                </tr>
            </thead>
            <tbody>
                ${group.courses.map((course, index) => {
        const levelInfo = !isLevel ? `<br><small>(Level ${course.level})</small>` : '';
        return `
                    <tr>
                        <td rowspan="2">${index + 1}</td>
                        <td rowspan="2" class="course-name-col">
                            ${course.course_name}<br>
                            ${course.course_code}${levelInfo}
                        </td>
                        <td class="grade-cell">${course.grades.A.value}</td>
                        <td class="grade-cell">${course.grades.B.value}</td>
                        <td class="grade-cell">${course.grades.C.value}</td>
                        <td class="grade-cell">${course.grades.D.value}</td>
                        <td class="grade-cell">${course.grades.F.value}</td>
                        <td rowspan="2">${course.totalStudents}</td>
                    </tr>
                    <tr class="percentage-row">
                        <td class="grade-cell">${course.grades.A.percentage}%</td>
                        <td class="grade-cell">${course.grades.B.percentage}%</td>
                        <td class="grade-cell">${course.grades.C.percentage}%</td>
                        <td class="grade-cell">${course.grades.D.percentage}%</td>
                        <td class="grade-cell">${course.grades.F.percentage}%</td>
                    </tr>
                    `;
    }).join('')}
                <tr class="total-row">
                    <td rowspan="2" colspan="2">Total</td>
                    <td class="grade-cell">${group.total.grades.A.value}</td>
                    <td class="grade-cell">${group.total.grades.B.value}</td>
                    <td class="grade-cell">${group.total.grades.C.value}</td>
                    <td class="grade-cell">${group.total.grades.D.value}</td>
                    <td class="grade-cell">${group.total.grades.F.value}</td>
                    <td rowspan="2">${group.total.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td class="grade-cell">${group.total.grades.A.percentage}%</td>
                    <td class="grade-cell">${group.total.grades.B.percentage}%</td>
                    <td class="grade-cell">${group.total.grades.C.percentage}%</td>
                    <td class="grade-cell">${group.total.grades.D.percentage}%</td>
                    <td class="grade-cell">${group.total.grades.F.percentage}%</td>
                </tr>
                <tr class="overall-row">
                    <td rowspan="2" colspan="2">Overall</td>
                    <td colspan="4">${group.overall.totalPassing}</td>
                    <td>${group.overall.totalFailing}</td>
                    <td rowspan="2"></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="4">${group.overall.overallPassPercentage}%</td>
                    <td>${group.overall.overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>`;

    // Generate chart for this group's courses + total
    const chartTitle = `Students Grades Distribution (${headerLabel})`;
    const chartData = [
        ...group.courses.map(course => ({
            label: course.course_code,
            grades: course.grades
        })),
        // Add total as the last bar
        {
            label: 'Total',
            grades: group.total.grades
        }
    ];

    const chartHtml = generateGradeDistributionChart(chartTitle, chartData);

    return `
    <div class="page">
        ${tableHtml}
        ${chartHtml}
    </div>`;
}

function generateGradeDistributionChart(title: string, chartData: Array<{ label: string, grades: GradeDistribution }>): string {
    const width = 700;
    const height = 300;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 }; // Reduced bottom margin since no rotation
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const grades = ['A', 'B', 'C', 'D', 'F'];
    const colors = {
        'A': '#86efac', // Light green (best grade) - updated
        'B': '#bef264', // Light lime green  
        'C': '#fde047', // Light yellow/orange
        'D': '#fdba74', // Light orange
        'F': '#fca5a5'  // Light red (worst grade)
    };

    // Calculate bar dimensions with adjusted spacing
    const groupSpacing = 15; // Reduced gap between course groups
    const availableWidth = chartWidth - (groupSpacing * (chartData.length - 1));
    const groupWidth = availableWidth / chartData.length;
    const barWidth = Math.min(10, (groupWidth - 8) / grades.length); // Wider bars (8-10px)
    const barSpacing = 3; // Increased space between bars within a group (was 1, now 3)

    // Find max percentage for scaling
    const maxPercentage = Math.max(...chartData.flatMap(data =>
        grades.map(grade => data.grades[grade as keyof GradeDistribution].percentage)
    ));
    const yScale = maxPercentage > 0 ? chartHeight / Math.max(maxPercentage, 100) : chartHeight / 100;

    // Generate bars
    const bars = chartData.map((data, groupIndex) => {
        const groupX = margin.left + (groupIndex * (groupWidth + groupSpacing)) + Math.max(5, (groupWidth - (grades.length * barWidth + (grades.length - 1) * barSpacing)) / 2);

        return grades.map((grade, gradeIndex) => {
            const percentage = data.grades[grade as keyof GradeDistribution].percentage;
            const barHeight = percentage * yScale;
            const x = groupX + (gradeIndex * (barWidth + barSpacing));
            const y = height - margin.bottom - barHeight;

            // Format percentage - show 0% for 0.0%, otherwise show without decimal if whole number
            const percentageText = percentage === 0 ? '0%' :
                percentage % 1 === 0 ? `${percentage.toFixed(0)}%` : `${percentage.toFixed(1)}%`;

            // Show label for all values (including 0)
            const showLabel = true;
            const labelX = x + (barWidth / 2); // Center horizontally on the bar
            const labelY = percentage === 0 ? height - margin.bottom - 20 : y - 15; // More offset from top

            // For rotated text, we need to use the exact center without offset
            const centerX = labelX;

            return `
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                      fill="${colors[grade as keyof typeof colors]}" 
                      stroke="#333" stroke-width="0.3" rx="1" ry="1" />
                <text x="${centerX}" y="${labelY}" text-anchor="middle" 
                      font-size="7" font-weight="bold" fill="#333" 
                      transform="rotate(-90, ${centerX}, ${labelY}) translate(-3, 3)">${percentageText}</text>
            `;
        }).join('');
    }).join('');

    // Generate Y-axis grid lines and labels
    const yAxisSteps = 10;
    const yAxisLines = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
        const value = (maxPercentage > 100 ? Math.ceil(maxPercentage / 10) * 10 : 100) * i / yAxisSteps;
        const y = height - margin.bottom - (value * yScale);
        return `
            <line x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" 
                  stroke="#e5e7eb" stroke-width="0.5" />
            <text x="${margin.left - 5}" y="${y + 3}" text-anchor="end" 
                  font-size="9" fill="#212121">${value.toFixed(0)}%</text>
        `;
    }).join('');

    // Generate X-axis labels (straight, no rotation)
    const xAxisLabels = chartData.map((data, index) => {
        const groupX = margin.left + (index * (groupWidth + groupSpacing)) + (groupWidth / 2);
        const y = height - margin.bottom + 15;

        // Smaller font size for course codes/level/department names
        const fontSize = "6";

        // Handle text wrapping if it overflows beyond bar group width
        const maxCharsPerLine = Math.floor(groupWidth / 4); // Approximate chars that fit
        const words = data.label.split(' ');
        let lines = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + word).length <= maxCharsPerLine) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) lines.push(currentLine);

        // If still too long, break long words
        if (lines.some(line => line.length > maxCharsPerLine)) {
            lines = lines.flatMap(line => {
                if (line.length <= maxCharsPerLine) return [line];
                const chunks = [];
                for (let i = 0; i < line.length; i += maxCharsPerLine) {
                    chunks.push(line.substring(i, i + maxCharsPerLine));
                }
                return chunks;
            });
        }

        return lines.map((line, lineIndex) => `
            <text x="${groupX}" y="${y + (lineIndex * 8)}" text-anchor="middle" font-size="${fontSize}" fill="#333" font-weight="bold">${line}</text>
        `).join('');
    }).join('');

    // Generate legend
    const legendItems = grades.map((grade, index) => {
        const x = (width / 2) - (grades.length * 35 / 2) + (index * 35);
        const y = height - 15;
        return `
            <rect x="${x}" y="${y - 8}" width="8" height="8" 
                  fill="${colors[grade as keyof typeof colors]}" rx="1" ry="1" />
            <text x="${x + 12}" y="${y}" font-size="9" fill="#333">${grade}</text>
        `;
    }).join('');

    return `
        <div class="chart-container">
            <div class="chart-title">${title}</div>
            <svg class="chart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                ${yAxisLines}
                ${bars}
                ${xAxisLabels}
                ${legendItems}
                
                <!-- Y-axis title -->
                <text x="20" y="${height / 2}" text-anchor="middle" font-size="10" fill="#333" 
                      transform="rotate(-90, 20, ${height / 2})">Percentage (%)</text>
                
                <!-- X-axis line -->
                <line x1="${margin.left}" x2="${width - margin.right}" 
                      y1="${height - margin.bottom}" y2="${height - margin.bottom}" 
                      stroke="#333" stroke-width="1" />
                
                <!-- Y-axis line -->
                <line x1="${margin.left}" x2="${margin.left}" 
                      y1="${margin.top}" y2="${height - margin.bottom}" 
                      stroke="#333" stroke-width="1" />
            </svg>
        </div>
    `;
}