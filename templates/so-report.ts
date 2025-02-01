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

export function generateSOHTML(
    assessmentData: Record<string, GradeCount>,
    overallGrades: GradeCount
) {
    // Calculate overall totals
    const totalStudents: number = Object.values(overallGrades).reduce<number>((sum, count) => sum + count, 0);

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                table { 
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
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
            </style>
        </head>
        <body>
            <div class="container">
                <h2 style="text-align: center;">Student Grade Distribution Report</h2>
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
            </div>
        </body>
    </html>`;
}
