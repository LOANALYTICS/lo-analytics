export function generateComparisonHTML(data: any): string {
    const { course1, course2, college } = data;

    const calculateStats = (kr: any) => {
        let accepted = 0;
        let rejected = 0;
        
        if (kr?.groupedItemAnalysisResults) {
            kr.groupedItemAnalysisResults.forEach((group: any) => {
                if (['Good Questions', 'Easy Questions', 'Very Easy Questions'].includes(group.classification)) {
                    accepted += (group.questions?.length || 0);
                } else if (['Poor (Bad) Questions', 'Very Difficult Questions', 'Difficult Questions'].includes(group.classification)) {
                    rejected += (group.questions?.length || 0);
                }
            });
        }

        const total = accepted + rejected || 1;
        return {
            accepted,
            rejected,
            acceptedPercentage: ((accepted / total) * 100).toFixed(2),
            rejectedPercentage: ((rejected / total) * 100).toFixed(2),
            kr20: (kr?.KR_20 || 0).toFixed(2)
        };
    };

    const stats1 = calculateStats(course1?.kr || {});
    const stats2 = calculateStats(course2?.kr || {});

    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Comparison</title>
        <style>
          body {
            margin: 0;
            padding: 0;
          }
          .tables-container {
            padding: 0;
            margin: 0;
          }
          table {
                      font-size: 12px;

            margin-top: 5px !important;
            margin-bottom: 40px !important;
          }
          table:last-child {
            margin-bottom: 0 !important;
          }

          @media print {
            .table-wrapper {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin: 15px 0 !important;
            }
            div {
              break-inside: avoid !important;
            }
          }
          .header-container {
            margin-bottom: 80px;
            width: 100%;
          }
          .header {
            text-align: center;
            width: 100%;

            padding: 4px;
            margin-bottom: 10px;
          }
          .header-description {
            max-width: fit-content;
            margin: 0 auto;
          }
          .header-description h2 {
            font-size: 16px;
            text-align: center;
          }
          .header-description hr {
            margin-top: 10px;
          }
          .header-description p {
            font-size: 12px;
            margin-top: -4px;
            text-align: center;
          }
          .college-logo {
            margin: 0 auto;
          }
          .college-name {
            font-size: 18px;
            font-weight: bold;
          }
          .university-name {
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="header-container" >
          <div class="header">
            ${college.logo ? `<img src="${college.logo}" alt="College Logo" class="college-logo"/>` : ''}
            <div class="college-name">
              ${college.english} | ${college.regional}
            </div>
            <div class="university-name">${college.university}</div>
          </div>
          <hr style="margin-bottom: 40px;"/>
          <div class="header-description">
            <h2>Course Comparison Report</h2>
            <hr/>
            <p>${course1.details.name} (${course1.details.section}) - ${course1.details.academic_year} vs ${course2.details.name} (${course2.details.section}) - ${course2.details.academic_year}</p>
          </div>
        </div>
        <div class="tables-container">
          <table class="min-w-full border-collapse border rounded-md overflow-hidden mt-[5px] border-gray-300">
            <colgroup>
              <col style="width: 40px;">
              <col style="width: 200px;">
              <col span="6" style="width: auto;">
            </colgroup>
            <thead>
              <tr>
                <th colspan="2" class="border border-gray-300 bg-yellow-200 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">Course Comparison</p>
                </th>
                <th colspan="3" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${course1.details.name} (${course1.details.section}) - ${course1.details.academic_year}</p>
                </th>
                <th colspan="3" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${course2.details.name} (${course2.details.section}) - ${course2.details.academic_year}</p>
                </th>
              </tr>
              <tr>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">N</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: left; margin: 0; margin-bottom: 10px;">Course</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
                <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="2" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">1</p>
                </td>
                <td rowspan="2" class="border border-gray-300 p-1">
                  <p style="text-align: left; margin: 0; margin-bottom: 10px;">${course1.details.name}</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats1.accepted}</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats1.rejected}</p>
                </td>
                <td rowspan="2" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats1.kr20}</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats2.accepted}</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats2.rejected}</p>
                </td>
                <td rowspan="2" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats2.kr20}</p>
                </td>
              </tr>
              <tr>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats1.acceptedPercentage}%</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats1.rejectedPercentage}%</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats2.acceptedPercentage}%</p>
                </td>
                <td class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats2.rejectedPercentage}%</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
    `;
} 