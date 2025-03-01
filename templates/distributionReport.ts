export function generateDistributionReportHTML(data: {
  courseName: string;
  topics: any[];
  papers: any[];
}) {

  // Ensure we have all required data
  if (!data.topics || !data.papers || !data.courseName) {
    console.error("Missing required data");
    return "";
  }

  // Get unique CLOs
  const clos = Array.from(
    new Set(
      data.papers.flatMap((p) =>
        p.topicQuestions.flatMap((tq: any) => Object.keys(tq.clos))
      )
    )
  ).sort();

  const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">S.No</th>
                    <th style="width: 20%;">Topics</th>
                    <th style="width: 10%;">Allowed Questions</th>
                    <th style="width: 15%;">Exams</th>
                    ${clos
                      .map(
                        (clo) =>
                          `<th style="width: ${
                            50 / clos.length
                          }%;">CLO-${clo.replace("clo", "")}</th>`
                      )
                      .join("")}
                    <th style="width: 10%;">Total Q Per Test</th>
                </tr>
            </thead>
            <tbody>
                ${data.topics
                  .filter((topic) => 
                    data.papers.some((paper) =>
                      paper.topicQuestions.some(
                        (tq: any) => tq.topic === topic.name
                      ) && paper.examName.trim() !== ""
                    )
                  )
                  .map((topic, index) => {
                    let relevantPapers = data.papers.filter((paper) =>
                      paper.topicQuestions.some(
                        (tq: any) => tq.topic === topic.name
                      )
                    );
                    // Filter out papers without an exam name
                    relevantPapers = relevantPapers.filter((paper) => paper.examName.trim() !== "")

                    return `
                    <tbody style="page-break-inside: avoid !important;">
                      ${relevantPapers.map((paper, paperIndex) => {
                        const topicQ = paper.topicQuestions.find(
                          (tq: any) => tq.topic === topic.name
                        );

                        return `
                        <tr>
                            ${paperIndex === 0 ? `<td rowspan="${relevantPapers.length}">${index + 1}</td>` : ''}
                            ${paperIndex === 0 ? `<td rowspan="${relevantPapers.length}">${topic.name}</td>` : ''}
                            ${paperIndex === 0 ? `<td rowspan="${relevantPapers.length}">${topic.allowedQuestion || "-"}</td>` : ''}
                            <td>${paper.examName}</td>
                            ${clos
                              .map((clo) => {
                                const cloCount = topicQ?.clos[clo] || 0;
                                const topicQuestions =
                                  paper.QuestionsOrder?.filter(
                                    (q: any) =>
                                      q.questionId.topic === topic.name &&
                                      q.clo.toString() === clo.replace("clo", "")
                                  )
                                    ?.slice(0, cloCount)
                                    ?.map((q: any) => q.orderNumber)
                                    ?.join(", ") || "";

                                return `<td>${cloCount ? `${cloCount} (${topicQuestions})` : "-"}</td>`;
                              })
                              .join("")}
                            <td>${topicQ?.total || "-"}</td>
                        </tr>
                        `;
                      }).join('')}
                    </tbody>
                    `;
                  })
                  .join("")}
                  
                  <tbody style="page-break-inside: avoid !important;">
                    <tr>
                      <td colspan="2">Total</td>
                      <td>${data.topics.reduce((sum, topic) => sum + (parseInt(topic.allowedQuestion) || 0), 0)}</td>
                      <td>${data.papers.reduce((sum: number, paper) => 
                        sum + paper.topicQuestions.reduce((tSum: number, tq: any) => tSum + (tq.total || 0), 0), 0)}</td>
                      ${clos.map(clo => `
                        <td>${data.papers.reduce((sum: number, paper) => 
                          sum + paper.topicQuestions.reduce((tSum: number, tq: any) => 
                            tSum + (tq.clos[clo] || 0), 0), 0)}</td>
                      `).join('')}
                      
                      <td>${data.papers.reduce((sum: number, paper) => 
                        sum + paper.topicQuestions.reduce((tSum: number, tq: any) => tSum + (tq.total || 0), 0), 0)}</td>
                    </tr>
                    <tr>
                      <td colspan="3">Total</td>
                      <td>% of Each CLOs</td>
                      ${clos.map(clo => {
                        const cloTotal = data.papers.reduce((sum: number, paper) => 
                          sum + paper.topicQuestions.reduce((tSum: number, tq: any) => 
                            tSum + (tq.clos[clo] || 0), 0), 0);
                        const totalQuestions = data.papers.reduce((sum: number, paper) => 
                          sum + paper.topicQuestions.reduce((tSum: number, tq: any) => 
                            tSum + (tq.total || 0), 0), 0);
                        return `<td>${totalQuestions ? Math.round((cloTotal / totalQuestions) * 100) : 0}%</td>`;
                      }).join('')}
                      <td>100%</td>
                    </tr>
                  </tbody>
            </tbody>
        </table>
    `;

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Distribution Report - ${data.courseName}</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 1cm;
                }
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.4;
                    font-size: 10px;
                    margin: 0;
                    padding: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    table-layout: fixed;
                }
                thead {
                    display: table-header-group;
                }
                tbody {
                    page-break-inside: avoid;
                }
                tr {
                    page-break-inside: avoid !important;
                }
                tr[data-topic-start="true"] {
                    break-before: auto;
                    break-after: avoid;
                }
                .topic-group {
                    break-inside: avoid;
                }
                td[rowspan] {
                    page-break-inside: avoid !important;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 10px;
                    text-align: center;
                    vertical-align: middle;
                    word-wrap: break-word;
                }
                th {
                    background-color: #f3f4f6;
                    font-weight: bold;
                }
                .header {
                    text-align: center;
                    margin-bottom: 25px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #000;
                }
                .title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">Question Distribution Report - ${data.courseName}</div>
            </div>
            ${tableHTML}
        </body>
        </html>
    `;
}
