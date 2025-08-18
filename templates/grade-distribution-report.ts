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

export function generateGradeDistributionHTML({
    data,
    academic_year,
    semester,
    section,
    college
}: ReportParams): string {
    const levelSummary = generateSummaryTable('level', data);
    const departmentSummary = generateSummaryTable('department', data);
    const levelTables = data.byLevel.map(levelGroup =>
        generateDetailedTable('level', levelGroup)
    ).join('');
    const departmentTables = data.byDepartment.map(deptGroup =>
        generateDetailedTable('department', deptGroup)
    ).join('');

    return generateHTMLDocument('Grade Distribution Report', `
        <div class="summary-page">
            ${levelSummary}
            ${departmentSummary}
        </div>
        ${levelTables}
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
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.1);
                    page-break-after: always;
                }
                
                .page:last-child {
                    page-break-after: avoid;
                }
                
                .summary-page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.1);
                    page-break-after: always;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
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
                    background-color: #666;
                    color: white;
                    font-weight: bold;
                    padding: 12px 8px;
                }
                
                .level-header {
                    background-color: #444 !important;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                }
                
                .header-row {
                    background-color: #444 !important;
                    color: white;
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
                    background-color: #f8f8f8;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .page, .summary-page {
                        width: auto;
                        height: auto;
                        margin: 0;
                        padding: 15mm;
                        box-shadow: none;
                        page-break-after: always;
                    }
                    
                    .page:last-child, .summary-page:last-child {
                        page-break-after: avoid;
                    }
                }
                
                @page {
                    size: A4;
                    margin: 15mm;
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

    return `
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
}

function generateDetailedTable(type: SummaryType, group: LevelGroup | DepartmentGroup): string {
    const isLevel = type === 'level';
    const headerLabel = isLevel ? `Level ${(group as LevelGroup).level}` : (group as DepartmentGroup).department;

    return `
    <div class="page">
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
        </table>
    </div>`;
}