export function generateCloReportHTML(data: {
    cloData: Array<{
        clo: string;
        description: string;
        ploMapping: {
            k: Array<{ [key: string]: boolean }>;
            s: Array<{ [key: string]: boolean }>;
            v: Array<{ [key: string]: boolean }>;
        };
    }>;
    percentage: number;
    achievementMap: Map<string, number>;
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
      indirectAssessmentData?: {
        indirectAssessments: Array<{
          clo: string;
          achievementRate: number;
          benchmark: string;
          achievementPercentage: number;
        }>;
      };
      
}) {
    const { cloData, percentage, achievementMap,course, college,indirectAssessmentData } = data;

    // Helper function to generate PLO cells
    const generatePloCells = (mapping: Array<{ [key: string]: boolean }>, cloId: string) => {
        return mapping.map((item, index) => {
            const isChecked = Object.values(item)[0];
            let directCell, indirectCell;
            
            // Direct cell (current logic)
            if (!isChecked) {
                directCell = `<td class="plo-cell"></td>`;
                indirectCell = `<td class="plo-cell">-</td>`;
            } else {
                const achievementValue = achievementMap.get(cloId);
                let displayValue = '✓';
                if (achievementValue !== undefined && achievementValue !== null) {
                    const numValue = Number(achievementValue);
                    if (!isNaN(numValue)) {
                        displayValue = `${numValue.toFixed(1)}%`;
                    }
                }
                directCell = `<td class="plo-cell checked">${displayValue}</td>`;
                
                // Indirect cell - find corresponding indirect assessment data
                let indirectValue = '-';
                if (indirectAssessmentData && indirectAssessmentData.indirectAssessments) {
                    const cloNumber = cloId.replace('clo', '');
                    const indirectAssessment = indirectAssessmentData.indirectAssessments.find(
                        assessment => assessment.clo === `CLO ${cloNumber}`
                    );
                    if (indirectAssessment) {
                        indirectValue = `${indirectAssessment.achievementPercentage.toFixed(1)}%`;
                    }
                }
                indirectCell = `<td class="plo-cell checked">${indirectValue}</td>`;
            }
            
            return directCell + indirectCell;
        }).join('');
    };

    const tableRows = cloData.map((clo, index) => `
        <tr>
            <td class="index-cell">CLO ${index + 1}</td>
            <td class="clo-cell">${clo.description}</td>
            ${generatePloCells(clo.ploMapping.k, `clo${index + 1}`)}
            ${generatePloCells(clo.ploMapping.s, `clo${index + 1}`)}
            ${generatePloCells(clo.ploMapping.v, `clo${index + 1}`)}
        </tr>
    `).join('');

    // Calculate averages for each PLO category
    const calculateAverage = (mapping: Array<{ [key: string]: boolean }>[], cloIds: string[]) => {
        const values: number[] = [];
        
        mapping.forEach((cloMapping, cloIndex) => {
            const cloId = cloIds[cloIndex];
            cloMapping.forEach((item, ploIndex) => {
                const isChecked = Object.values(item)[0];
                if (isChecked) {
                    const achievementValue = achievementMap.get(cloId);
                    if (achievementValue !== undefined && achievementValue !== null) {
                        const numValue = Number(achievementValue);
                        if (!isNaN(numValue)) {
                            values.push(numValue);
                        }
                    }
                }
            });
        });
        
        if (values.length === 0) return '-';
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        return `${average.toFixed(1)}%`;
    };

    const calculateIndirectAverage = (mapping: Array<{ [key: string]: boolean }>[], cloIds: string[]) => {
        const values: number[] = [];
        
        mapping.forEach((cloMapping, cloIndex) => {
            const cloId = cloIds[cloIndex];
            const cloNumber = cloId.replace('clo', '');
            cloMapping.forEach((item, ploIndex) => {
                const isChecked = Object.values(item)[0];
                if (isChecked && indirectAssessmentData && indirectAssessmentData.indirectAssessments) {
                    const indirectAssessment = indirectAssessmentData.indirectAssessments.find(
                        assessment => assessment.clo === `CLO ${cloNumber}`
                    );
                    if (indirectAssessment) {
                        values.push(indirectAssessment.achievementPercentage);
                    }
                }
            });
        });
        
        if (values.length === 0) return '-';
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        return `${average.toFixed(1)}%`;
    };

    // Generate average cells for each PLO category
    const generateAverageCells = () => {
        const cloIds = cloData.map((_, index) => `clo${index + 1}`);
        
        const kMapping = cloData.map(clo => clo.ploMapping.k);
        const sMapping = cloData.map(clo => clo.ploMapping.s);
        const vMapping = cloData.map(clo => clo.ploMapping.v);
        
        const kDirectAvg = calculateAverage(kMapping, cloIds);
        const kIndirectAvg = calculateIndirectAverage(kMapping, cloIds);
        const sDirectAvg = calculateAverage(sMapping, cloIds);
        const sIndirectAvg = calculateIndirectAverage(sMapping, cloIds);
        const vDirectAvg = calculateAverage(vMapping, cloIds);
        const vIndirectAvg = calculateIndirectAverage(vMapping, cloIds);
        
        return `
            ${cloData[0].ploMapping.k.map(() => `<td class="plo-cell">${kDirectAvg}</td><td class="plo-cell checked">${kIndirectAvg}</td>`).join('')}
            ${cloData[0].ploMapping.s.map(() => `<td class="plo-cell">${sDirectAvg}</td><td class="plo-cell checked">${sIndirectAvg}</td>`).join('')}
            ${cloData[0].ploMapping.v.map(() => `<td class="plo-cell">${vDirectAvg}</td><td class="plo-cell checked">${vIndirectAvg}</td>`).join('')}
        `;
    };

    // Add summary row
    const summaryRow = `
        <tr>
            <td class="index-cell" colspan="2">Average</td>
            ${generateAverageCells()}
        </tr>
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>CLO Achievement Report (${percentage}%)</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 0;
                }
                html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
                .container {
                    width: auto !important;
                    max-width: none !important;
                    min-width: 0 !important;
                    margin: 0;
                    padding: 0;
                    background: none;
                }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { max-width: 100%; height: auto; }
                .title { font-size: 24px; margin: 20px 0; }
                .course-details {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                
                padding-left: 15px;
                padding-right: 15px;
                padding-top: 10px;
                padding-bottom: 25px;
                border-radius: 5px;
                }
                .detail-item {
                    display: flex;
                    gap: 4px;
                    font-weight: 600;
                    font-size: 20px;
                }
                .detail-label {
                    font-weight: 700;
                }

                table {
                    width: auto !important;
                    min-width: 0 !important;
                    max-width: none !important;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    overflow: hidden;
                    border-collapse: collapse;
                    margin-top: 15px;
                    page-break-inside: auto;
                    table-layout: auto;
                }
                thead {
                    display: table-header-group;
                }
                tbody {
                    display: table-row-group;
                }
                tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    -webkit-column-break-inside: avoid;
                    display: table-row;
                }
                th {
                    display: table-cell;
                }
                td {
                    display: table-cell;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding-left: 6px;
                    padding-right: 6px;
                    padding-top: 6px;
                    padding-bottom: 14px;
                    text-align: center;
                    font-size: 15px;
                    font-weight: 600;
                }
                th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                    font-size: 16px;

                }
                .index-cell {
                
                white-space:nowrap;
                    width: 50px;
                }
                .clo-cell {
                    text-align: left;
                    width:auto;
                    min-width: 280px;
                    max-width:280px

                }
                .plo-cell {
                    width: 40px;
                }
                .plo-cell.checked {
                    background-color: #e6ffe6;
                }
                .plo-header {
                    font-weight: 600;
                    background-color: #f0f0f0;
                }
                .plo-subheader {
                    font-weight: 600;
                    text-transform: capitalize;
                }
                .h2_class {font-weight: 700; text-align: center; margin-bottom: 30px;,margin:auto; font-size:20px }
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
             <h2 class="h2_class">Program Learning Outcome (PLO) Acheivement Report </h2>
            <table>
                <thead>
                    <tr>
                        <th rowspan="4" style='font-weight:700; font-size:700;'>CLOs</th>
                        <th rowspan="4" style='font-weight:700; font-size:700;'>Course Learning Outcome (CLO) Description</th>
                        <th colspan="${(cloData[0].ploMapping.k.length + cloData[0].ploMapping.s.length + cloData[0].ploMapping.v.length) * 2}" style='font-weight:600;'>Alignement of CLO with Program Learning Outcome (PLO)</th>
                    </tr>
                    <tr>
                        <th colspan="${cloData[0].ploMapping.k.length * 2}" class="plo-header">Knowledge</th>
                        <th colspan="${cloData[0].ploMapping.s.length * 2}" class="plo-header">Skills</th>
                        <th colspan="${cloData[0].ploMapping.v.length * 2}" class="plo-header">Values</th>
                    </tr>
                    <tr>
                        ${cloData[0].ploMapping.k.map((_, i) => `<th colspan="2" class="plo-header">K${i + 1}</th>`).join('')}
                        ${cloData[0].ploMapping.s.map((_, i) => `<th colspan="2" class="plo-header">S${i + 1}</th>`).join('')}
                        ${cloData[0].ploMapping.v.map((_, i) => `<th colspan="2" class="plo-header">V${i + 1}</th>`).join('')}
                    </tr>
                    <tr>
                        ${cloData[0].ploMapping.k.map(() => `<th class=\"plo-subheader\">Direct</th><th class=\"plo-subheader\">Indirect</th>`).join('')}
                        ${cloData[0].ploMapping.s.map(() => `<th class=\"plo-subheader\">Direct</th><th class=\"plo-subheader\">Indirect</th>`).join('')}
                        ${cloData[0].ploMapping.v.map(() => `<th class=\"plo-subheader\">Direct</th><th class=\"plo-subheader\">Indirect</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                    ${summaryRow}
                </tbody>
            </table>
        </body>
        </html>
    `;
} 