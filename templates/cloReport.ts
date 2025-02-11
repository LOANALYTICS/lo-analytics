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
}) {
    const { cloData, percentage, achievementMap,course, college } = data;

    // Helper function to generate PLO cells
    const generatePloCells = (mapping: Array<{ [key: string]: boolean }>, cloId: string) => {
        return mapping.map((item, index) => {
            const isChecked = Object.values(item)[0];
            if (!isChecked) return `<td class="plo-cell"></td>`;
            
            const achievementValue = achievementMap.get(cloId);
            
            // Handle different cases for achievement value
            let displayValue = '✓';  // default checkmark
            if (achievementValue !== undefined && achievementValue !== null) {
                // Convert to number and check if it's valid
                const numValue = Number(achievementValue);
                if (!isNaN(numValue)) {
                    displayValue = `${numValue.toFixed(1)}%`;
                }
            }
            
            return `<td class="plo-cell checked">${displayValue}</td>`;
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

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>CLO Achievement Report (${percentage}%)</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 1cm;
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    padding: 0;
                    font-size: 11px;
                    font-weight: 400;
                }
                .container { max-width: 1200px; margin: 0 auto; padding: 10px; }
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
                padding-top: 15px;
                padding-bottom: 30px;
                border-radius: 5px;
                }
                .detail-item {
                    display: flex;
                    gap: 5px;
                    font-weight: 400;
                    font-size: 15px;
                }
                .detail-label {
                    font-weight: bold;
                }

                table {
                    width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    overflow: hidden;
                    border-collapse: collapse;
                    margin-top: 15px;
                    page-break-inside: auto;
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
                    font-size: 12px;
                    font-weight: 400;
                }
                th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .index-cell {
                    width: 50px;
                }
                .clo-cell {
                    text-align: left;
                    min-width: 300px;
                }
                .plo-cell {
                    width: 40px;
                }
                .plo-cell.checked {
                    background-color: #e6ffe6;
                }
                .plo-header {
                    background-color: #f0f0f0;
                }
                .plo-subheader {
                    font-weight: normal;
                    text-transform: uppercase;
                }
                .h2_class {font-weight: 600; text-align: center; margin-bottom: 30px;,margin:auto; font-size:16px }
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
                        <th rowspan="3">CLOs</th>
                        <th rowspan="3">Course Learning Outcome (CLO) Description</th>
                        <th colspan="${cloData[0].ploMapping.k.length + cloData[0].ploMapping.s.length + cloData[0].ploMapping.v.length}">Alignement of CLO with Program Learning Outcome (PLO)</th>
                    </tr>
                    <tr>
                        <th colspan="${cloData[0].ploMapping.k.length}" class="plo-header">Knowledge</th>
                        <th colspan="${cloData[0].ploMapping.s.length}" class="plo-header">Skills</th>
                        <th colspan="${cloData[0].ploMapping.v.length}" class="plo-header">Values</th>
                    </tr>
                    <tr>
                        ${cloData[0].ploMapping.k.map((_, i) => `<th class="plo-subheader">K${i + 1}</th>`).join('')}
                        ${cloData[0].ploMapping.s.map((_, i) => `<th class="plo-subheader">S${i + 1}</th>`).join('')}
                        ${cloData[0].ploMapping.v.map((_, i) => `<th class="plo-subheader">V${i + 1}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </body>
        </html>
    `;
} 