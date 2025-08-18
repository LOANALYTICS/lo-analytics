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

interface GradeDistributionData {
    byLevel: LevelGroup[];
    byDepartment: DepartmentGroup[];
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

export function generateGradeDistributionHTML({
    data,
    academic_year,
    semester,
    section,
    college
}: ReportParams): string {

    // Generate summary tables
    const levelSummary = generateLevelSummaryTable(data);
    const departmentSummary = generateDepartmentSummaryTable(data);

    // Generate level-wise tables
    const levelTables = data.byLevel.map(levelGroup =>
        generateLevelTable(levelGroup, academic_year, semester, section)
    ).join('');

    // Generate department-wise tables  
    const departmentTables = data.byDepartment.map(deptGroup =>
        generateDepartmentTable(deptGroup, academic_year, semester, section)
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Grade Distribution Report</title>
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
                
                .level-row, .dept-row {
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
            <div class="summary-page">
                ${levelSummary}
                ${departmentSummary}
            </div>
            ${levelTables}
            ${departmentTables}
        </body>
    </html>`;
}

// New function to generate Level Summary Report
export function generateLevelSummaryHTML({
    data,
    academic_year,
    semester,
    section,
    college
}: ReportParams): string {
    const semesterText = semester === 1 ? "First Semester" : "Second Semester";
    const sectionText = section.charAt(0).toUpperCase() + section.slice(1);

    // Calculate overall totals
    const overallTotals = {
        A: 0, B: 0, C: 0, D: 0, F: 0, totalStudents: 0
    };

    data.byLevel.forEach(level => {
        overallTotals.A += level.total.grades.A.value;
        overallTotals.B += level.total.grades.B.value;
        overallTotals.C += level.total.grades.C.value;
        overallTotals.D += level.total.grades.D.value;
        overallTotals.F += level.total.grades.F.value;
        overallTotals.totalStudents += level.total.totalStudents;
    });

    const overallPassing = overallTotals.A + overallTotals.B + overallTotals.C + overallTotals.D;
    const overallPassPercentage = overallTotals.totalStudents > 0 ?
        ((overallPassing / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';
    const overallFailPercentage = overallTotals.totalStudents > 0 ?
        ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Level Summary Report</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 20px;
                    font-size: 12px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px auto;
                    border: 2px solid #333;
                    max-width: 800px;
                }
                
                th, td {
                    border: 1px solid #333;
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 12px;
                    vertical-align: middle;
                }
                
                th {
                    background-color: #666;
                    color: white;
                    font-weight: bold;
                }
                
                .header-row {
                    background-color: #444 !important;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .level-row {
                    background-color: #555;
                    color: white;
                    font-weight: bold;
                }
                
                .percentage-row {
                    font-style: italic;
                    background-color: #f8f8f8;
                }
                
                .total-row {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                
                .overall-row {
                    background-color: #d0d0d0;
                    font-weight: bold;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 15mm;
                    }
                }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr class="header-row">
                        <th rowspan="2">Level</th>
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
                    ${data.byLevel.map(level => `
                    <tr class="level-row">
                        <td rowspan="2">Level ${level.level}</td>
                        <td>${level.total.grades.A.value}</td>
                        <td>${level.total.grades.B.value}</td>
                        <td>${level.total.grades.C.value}</td>
                        <td>${level.total.grades.D.value}</td>
                        <td>${level.total.grades.F.value}</td>
                        <td rowspan="2">${level.total.totalStudents}</td>
                    </tr>
                    <tr class="percentage-row">
                        <td>${level.total.grades.A.percentage}%</td>
                        <td>${level.total.grades.B.percentage}%</td>
                        <td>${level.total.grades.C.percentage}%</td>
                        <td>${level.total.grades.D.percentage}%</td>
                        <td>${level.total.grades.F.percentage}%</td>
                    </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td rowspan="2">Total</td>
                        <td>${overallTotals.A}</td>
                        <td>${overallTotals.B}</td>
                        <td>${overallTotals.C}</td>
                        <td>${overallTotals.D}</td>
                        <td>${overallTotals.F}</td>
                        <td rowspan="2">${overallTotals.totalStudents}</td>
                    </tr>
                    <tr class="total-row percentage-row">
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.A / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.B / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.C / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.D / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                    <tr class="overall-row">
                        <td rowspan="2">Overall</td>
                        <td colspan="4">${overallPassing}</td>
                        <td>${overallTotals.F}</td>
                        <td rowspan="2"></td>
                    </tr>
                    <tr class="overall-row">
                        <td colspan="4">${overallPassPercentage}%</td>
                        <td>${overallFailPercentage}%</td>
                    </tr>
                </tbody>
            </table>
        </body>
    </html>`;
}

// New function to generate Department Summary Report
export function generateDepartmentSummaryHTML({
    data,
    academic_year,
    semester,
    section,
    college
}: ReportParams): string {
    const semesterText = semester === 1 ? "First Semester" : "Second Semester";
    const sectionText = section.charAt(0).toUpperCase() + section.slice(1);

    // Calculate overall totals
    const overallTotals = {
        A: 0, B: 0, C: 0, D: 0, F: 0, totalStudents: 0
    };

    data.byDepartment.forEach(dept => {
        overallTotals.A += dept.total.grades.A.value;
        overallTotals.B += dept.total.grades.B.value;
        overallTotals.C += dept.total.grades.C.value;
        overallTotals.D += dept.total.grades.D.value;
        overallTotals.F += dept.total.grades.F.value;
        overallTotals.totalStudents += dept.total.totalStudents;
    });

    const overallPassing = overallTotals.A + overallTotals.B + overallTotals.C + overallTotals.D;
    const overallPassPercentage = overallTotals.totalStudents > 0 ?
        ((overallPassing / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';
    const overallFailPercentage = overallTotals.totalStudents > 0 ?
        ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Department Summary Report</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0;
                    padding: 20px;
                    font-size: 12px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px auto;
                    border: 2px solid #333;
                    max-width: 900px;
                }
                
                th, td {
                    border: 1px solid #333;
                    padding: 12px 8px;
                    text-align: center;
                    font-size: 12px;
                    vertical-align: middle;
                }
                
                th {
                    background-color: #666;
                    color: white;
                    font-weight: bold;
                }
                
                .header-row {
                    background-color: #444 !important;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                }
                
                .dept-row {
                    background-color: #555;
                    color: white;
                    font-weight: bold;
                }
                
                .dept-name {
                    text-align: left !important;
                    max-width: 200px;
                    word-wrap: break-word;
                }
                
                .percentage-row {
                    font-style: italic;
                    background-color: #f8f8f8;
                }
                
                .total-row {
                    background-color: #f0f0f0;
                    font-weight: bold;
                }
                
                .overall-row {
                    background-color: #d0d0d0;
                    font-weight: bold;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 15mm;
                    }
                }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr class="header-row">
                        <th rowspan="2">Department</th>
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
                    ${data.byDepartment.map(dept => `
                    <tr class="dept-row">
                        <td rowspan="2" class="dept-name">${dept.department}</td>
                        <td>${dept.total.grades.A.value}</td>
                        <td>${dept.total.grades.B.value}</td>
                        <td>${dept.total.grades.C.value}</td>
                        <td>${dept.total.grades.D.value}</td>
                        <td>${dept.total.grades.F.value}</td>
                        <td rowspan="2">${dept.total.totalStudents}</td>
                    </tr>
                    <tr class="percentage-row">
                        <td>${dept.total.grades.A.percentage}%</td>
                        <td>${dept.total.grades.B.percentage}%</td>
                        <td>${dept.total.grades.C.percentage}%</td>
                        <td>${dept.total.grades.D.percentage}%</td>
                        <td>${dept.total.grades.F.percentage}%</td>
                    </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td rowspan="2">Total</td>
                        <td>${overallTotals.A}</td>
                        <td>${overallTotals.B}</td>
                        <td>${overallTotals.C}</td>
                        <td>${overallTotals.D}</td>
                        <td>${overallTotals.F}</td>
                        <td rowspan="2">${overallTotals.totalStudents}</td>
                    </tr>
                    <tr class="total-row percentage-row">
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.A / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.B / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.C / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.D / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                        <td>${overallTotals.totalStudents > 0 ? ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    </tr>
                    <tr class="overall-row">
                        <td rowspan="2">Overall</td>
                        <td colspan="4">${overallPassing}</td>
                        <td>${overallTotals.F}</td>
                        <td rowspan="2"></td>
                    </tr>
                    <tr class="overall-row">
                        <td colspan="4">${overallPassPercentage}%</td>
                        <td>${overallFailPercentage}%</td>
                    </tr>
                </tbody>
            </table>
        </body>
    </html>`;
}

function generateLevelSummaryTable(data: GradeDistributionData): string {
    // Calculate overall totals
    const overallTotals = {
        A: 0, B: 0, C: 0, D: 0, F: 0, totalStudents: 0
    };

    data.byLevel.forEach(level => {
        overallTotals.A += level.total.grades.A.value;
        overallTotals.B += level.total.grades.B.value;
        overallTotals.C += level.total.grades.C.value;
        overallTotals.D += level.total.grades.D.value;
        overallTotals.F += level.total.grades.F.value;
        overallTotals.totalStudents += level.total.totalStudents;
    });

    const overallPassing = overallTotals.A + overallTotals.B + overallTotals.C + overallTotals.D;
    const overallPassPercentage = overallTotals.totalStudents > 0 ?
        ((overallPassing / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';
    const overallFailPercentage = overallTotals.totalStudents > 0 ?
        ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';

    return `
        <table class="summary-table">
            <thead>
                <tr class="header-row">
                    <th rowspan="2">Level</th>
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
                ${data.byLevel.map(level => `
                <tr>
                    <td rowspan="2" style="font-weight: bold;">Level ${level.level}</td>
                    <td>${level.total.grades.A.value}</td>
                    <td>${level.total.grades.B.value}</td>
                    <td>${level.total.grades.C.value}</td>
                    <td>${level.total.grades.D.value}</td>
                    <td>${level.total.grades.F.value}</td>
                    <td rowspan="2">${level.total.totalStudents}</td>
                </tr>
                <tr class="percentage-row">
                    <td>${level.total.grades.A.percentage}%</td>
                    <td>${level.total.grades.B.percentage}%</td>
                    <td>${level.total.grades.C.percentage}%</td>
                    <td>${level.total.grades.D.percentage}%</td>
                    <td>${level.total.grades.F.percentage}%</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td rowspan="2">Total</td>
                    <td>${overallTotals.A}</td>
                    <td>${overallTotals.B}</td>
                    <td>${overallTotals.C}</td>
                    <td>${overallTotals.D}</td>
                    <td>${overallTotals.F}</td>
                    <td rowspan="2">${overallTotals.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.A / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.B / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.C / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.D / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr class="overall-row">
                    <td rowspan="2">Overall</td>
                    <td colspan="4">${overallPassing}</td>
                    <td>${overallTotals.F}</td>
                    <td rowspan="2"></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="4">${overallPassPercentage}%</td>
                    <td>${overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>`;
}

function generateDepartmentSummaryTable(data: GradeDistributionData): string {
    // Calculate overall totals
    const overallTotals = {
        A: 0, B: 0, C: 0, D: 0, F: 0, totalStudents: 0
    };

    data.byDepartment.forEach(dept => {
        overallTotals.A += dept.total.grades.A.value;
        overallTotals.B += dept.total.grades.B.value;
        overallTotals.C += dept.total.grades.C.value;
        overallTotals.D += dept.total.grades.D.value;
        overallTotals.F += dept.total.grades.F.value;
        overallTotals.totalStudents += dept.total.totalStudents;
    });

    const overallPassing = overallTotals.A + overallTotals.B + overallTotals.C + overallTotals.D;
    const overallPassPercentage = overallTotals.totalStudents > 0 ?
        ((overallPassing / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';
    const overallFailPercentage = overallTotals.totalStudents > 0 ?
        ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0';

    return `
        <table class="summary-table">
            <thead>
                <tr class="header-row">
                    <th rowspan="2">Department</th>
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
                ${data.byDepartment.map(dept => `
                <tr>
                    <td rowspan="2" class="dept-name" style="font-weight: bold;">${dept.department}</td>
                    <td>${dept.total.grades.A.value}</td>
                    <td>${dept.total.grades.B.value}</td>
                    <td>${dept.total.grades.C.value}</td>
                    <td>${dept.total.grades.D.value}</td>
                    <td>${dept.total.grades.F.value}</td>
                    <td rowspan="2">${dept.total.totalStudents}</td>
                </tr>
                <tr class="percentage-row">
                    <td>${dept.total.grades.A.percentage}%</td>
                    <td>${dept.total.grades.B.percentage}%</td>
                    <td>${dept.total.grades.C.percentage}%</td>
                    <td>${dept.total.grades.D.percentage}%</td>
                    <td>${dept.total.grades.F.percentage}%</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td rowspan="2">Total</td>
                    <td>${overallTotals.A}</td>
                    <td>${overallTotals.B}</td>
                    <td>${overallTotals.C}</td>
                    <td>${overallTotals.D}</td>
                    <td>${overallTotals.F}</td>
                    <td rowspan="2">${overallTotals.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.A / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.B / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.C / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.D / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                    <td>${overallTotals.totalStudents > 0 ? ((overallTotals.F / overallTotals.totalStudents) * 100).toFixed(1) : '0.0'}%</td>
                </tr>
                <tr class="overall-row">
                    <td rowspan="2">Overall</td>
                    <td colspan="4">${overallPassing}</td>
                    <td>${overallTotals.F}</td>
                    <td rowspan="2"></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="4">${overallPassPercentage}%</td>
                    <td>${overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>`;
}

function generateLevelTable(levelGroup: LevelGroup, academic_year: string, semester: number, section: string): string {
    const semesterText = semester === 1 ? "First Semester" : "Second Semester";
    const sectionText = section.charAt(0).toUpperCase() + section.slice(1);

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
                    <th colspan="2" class="level-header">Level ${levelGroup.level}</th>
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
                ${levelGroup.courses.map((course, index) => `
                <tr>
                    <td rowspan="2">${index + 1}</td>
                    <td rowspan="2" class="course-name-col">
                        ${course.course_name}<br>
                        ${course.course_code}
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
                `).join('')}
                <tr class="total-row">
                    <td rowspan="2" colspan="2">Total</td>
                    <td class="grade-cell">${levelGroup.total.grades.A.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.B.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.C.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.D.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.F.value}</td>
                    <td rowspan="2">${levelGroup.total.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td class="grade-cell">${levelGroup.total.grades.A.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.B.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.C.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.D.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.F.percentage}%</td>
                </tr>
                <tr class="overall-row">
                    <td rowspan="2" colspan="2">Overall</td>
                    <td colspan="4">${levelGroup.overall.totalPassing}</td>
                    <td>${levelGroup.overall.totalFailing}</td>
                    <td rowspan="2"></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="4">${levelGroup.overall.overallPassPercentage}%</td>
                    <td>${levelGroup.overall.overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

function generateDepartmentTable(deptGroup: DepartmentGroup, academic_year: string, semester: number, section: string): string {
    const semesterText = semester === 1 ? "First Semester" : "Second Semester";
    const sectionText = section.charAt(0).toUpperCase() + section.slice(1);

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
                    <th colspan="2" class="level-header">${deptGroup.department}</th>
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
                ${deptGroup.courses.map((course, index) => `
                <tr>
                    <td rowspan="2">${index + 1}</td>
                    <td rowspan="2" class="course-name-col">
                        ${course.course_name}<br>
                        ${course.course_code}<br>
                        <small>(Level ${course.level})</small>
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
                `).join('')}
                <tr class="total-row">
                    <td rowspan="2" colspan="2">Total</td>
                    <td class="grade-cell">${deptGroup.total.grades.A.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.B.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.C.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.D.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.F.value}</td>
                    <td rowspan="2">${deptGroup.total.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td class="grade-cell">${deptGroup.total.grades.A.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.B.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.C.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.D.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.F.percentage}%</td>
                </tr>
                <tr class="overall-row">
                    <td rowspan="2" colspan="2">Overall</td>
                    <td colspan="4">${deptGroup.overall.totalPassing}</td>
                    <td>${deptGroup.overall.totalFailing}</td>
                    <td rowspan="2"></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="4">${deptGroup.overall.overallPassPercentage}%</td>
                    <td>${deptGroup.overall.overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>
    </div>`;
}