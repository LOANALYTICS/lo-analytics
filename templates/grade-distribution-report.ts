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
}

interface DepartmentGroup {
    department: string;
    courses: CourseSOAverage[];
    total: GroupTotal;
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
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                
                .logo {
                    max-width: 80px;
                    height: auto;
                    margin-bottom: 10px;
                }
                
                .college-name {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 5px 0;
                }
                
                .university-name {
                    font-size: 14px;
                    margin: 5px 0;
                }
                
                .report-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 20px 0 10px 0;
                }
                
                .report-info {
                    font-size: 12px;
                    margin-bottom: 20px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    border: 2px solid #333;
                }
                
                th, td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                    font-size: 11px;
                    vertical-align: middle;
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
                    
                    .page {
                        width: auto;
                        height: auto;
                        margin: 0;
                        padding: 15mm;
                        box-shadow: none;
                        page-break-after: always;
                    }
                    
                    .page:last-child {
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
            ${levelTables}
            ${departmentTables}
        </body>
    </html>`;
}

function generateLevelTable(levelGroup: LevelGroup, academic_year: string, semester: number, section: string): string {
    const semesterText = semester === 1 ? "First Semester" : "Second Semester";
    const sectionText = section.charAt(0).toUpperCase() + section.slice(1);

    // Calculate overall pass/fail for the level
    const totalPassing = levelGroup.total.grades.A.value + levelGroup.total.grades.B.value +
        levelGroup.total.grades.C.value + levelGroup.total.grades.D.value;
    const totalFailing = levelGroup.total.grades.F.value;
    const overallPassPercentage = levelGroup.total.totalStudents > 0 ?
        ((totalPassing / levelGroup.total.totalStudents) * 100).toFixed(1) : '0.0';
    const overallFailPercentage = levelGroup.total.totalStudents > 0 ?
        ((totalFailing / levelGroup.total.totalStudents) * 100).toFixed(1) : '0.0';

    return `
    <div class="page">
        <div class="header">
            <div class="college-name">College of Dentistry</div>
            <div class="university-name">University Name</div>
            <div class="report-title">Grade Distribution Report</div>
            <div class="report-info">
                ${semesterText}, ${academic_year} (${sectionText}) - Level ${levelGroup.level}
            </div>
        </div>
        
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
                    <th colspan="8" class="level-header">Level ${levelGroup.level}</th>
                </tr>
                <tr>
                    <th>S No</th>
                    <th>Course Name & Code</th>
                    <th class="grade-cell">A</th>
                    <th class="grade-cell">B</th>
                    <th class="grade-cell">C</th>
                    <th class="grade-cell">D</th>
                    <th class="grade-cell">F</th>
                    <th>Total N. of students</th>
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
                    <td colspan="2">Total</td>
                    <td class="grade-cell">${levelGroup.total.grades.A.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.B.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.C.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.D.value}</td>
                    <td class="grade-cell">${levelGroup.total.grades.F.value}</td>
                    <td>${levelGroup.total.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td colspan="2"></td>
                    <td class="grade-cell">${levelGroup.total.grades.A.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.B.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.C.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.D.percentage}%</td>
                    <td class="grade-cell">${levelGroup.total.grades.F.percentage}%</td>
                    <td></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="2">Overall</td>
                    <td colspan="4">${totalPassing}<br>${overallPassPercentage}%</td>
                    <td colspan="2">${totalFailing}<br>${overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

function generateDepartmentTable(deptGroup: DepartmentGroup, academic_year: string, semester: number, section: string): string {
    const semesterText = semester === 1 ? "First Semester" : "Second Semester";
    const sectionText = section.charAt(0).toUpperCase() + section.slice(1);

    // Calculate overall pass/fail for the department
    const totalPassing = deptGroup.total.grades.A.value + deptGroup.total.grades.B.value +
        deptGroup.total.grades.C.value + deptGroup.total.grades.D.value;
    const totalFailing = deptGroup.total.grades.F.value;
    const overallPassPercentage = deptGroup.total.totalStudents > 0 ?
        ((totalPassing / deptGroup.total.totalStudents) * 100).toFixed(1) : '0.0';
    const overallFailPercentage = deptGroup.total.totalStudents > 0 ?
        ((totalFailing / deptGroup.total.totalStudents) * 100).toFixed(1) : '0.0';

    return `
    <div class="page">
        <div class="header">
            <div class="college-name">College of Dentistry</div>
            <div class="university-name">University Name</div>
            <div class="report-title">Grade Distribution Report</div>
            <div class="report-info">
                ${semesterText}, ${academic_year} (${sectionText}) - ${deptGroup.department}
            </div>
        </div>
        
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
                    <th colspan="8" class="level-header">${deptGroup.department}</th>
                </tr>
                <tr>
                    <th>S No</th>
                    <th>Course Name & Code</th>
                    <th class="grade-cell">A</th>
                    <th class="grade-cell">B</th>
                    <th class="grade-cell">C</th>
                    <th class="grade-cell">D</th>
                    <th class="grade-cell">F</th>
                    <th>Total N. of students</th>
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
                    <td colspan="2">Total</td>
                    <td class="grade-cell">${deptGroup.total.grades.A.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.B.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.C.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.D.value}</td>
                    <td class="grade-cell">${deptGroup.total.grades.F.value}</td>
                    <td>${deptGroup.total.totalStudents}</td>
                </tr>
                <tr class="total-row percentage-row">
                    <td colspan="2"></td>
                    <td class="grade-cell">${deptGroup.total.grades.A.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.B.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.C.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.D.percentage}%</td>
                    <td class="grade-cell">${deptGroup.total.grades.F.percentage}%</td>
                    <td></td>
                </tr>
                <tr class="overall-row">
                    <td colspan="2">Overall</td>
                    <td colspan="4">${totalPassing}<br>${overallPassPercentage}%</td>
                    <td colspan="2">${totalFailing}<br>${overallFailPercentage}%</td>
                </tr>
            </tbody>
        </table>
    </div>`;
}