import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

async function generateAchievementChartHTML(achievementData: any, sortedClos: string[]): Promise<string> {
  const chartData = sortedClos.map(clo => {
    const achievement = achievementData[60].find((a: any) => a.clo === clo);
    return achievement ? parseFloat(achievement.percentageAchieving) : 0;
  });

  const labels = sortedClos.map(clo => clo.toUpperCase());
  
  const chartConfig = encodeURIComponent(JSON.stringify({
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Achievement Percentage',
          data: chartData,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          barThickness: 40,
          borderRadius: 4
        },
        {
          label: 'Threshold (60%)',
          data: Array(sortedClos.length).fill(60),
          type: 'line',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: { dataset: { label: string }, raw: number }) {
              return `${context.dataset.label}: ${context.raw}%`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 50,
          max: 100,
          ticks: {
            callback: (value: number) => value + '%',
            stepSize: 5,
            font: {
              size: 11,
              weight: 'bold'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)',
            drawTicks: false
          },
          title: {
            display: true,
            text: 'Percentage',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              weight: 'bold'
            }
          },
          title: {
            display: true,
            text: 'Course Learning Outcomes (CLOs)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        }
      }
    }
  }));

  const chartUrl = `https://quickchart.io/chart?c=${chartConfig}&w=800&h=400&format=base64&v=${Date.now()}`;
  
  try {
    const response = await fetch(chartUrl);
    const base64Image = await response.text();
    
    return `
      <div style="break-inside: avoid; page-break-inside: avoid;">
        <h2 class="h2_class">CLO Achievement Chart</h2>
        <div style="text-align: center; margin: 20px 0;">
          <img src="data:image/png;base64,${base64Image}" alt="CLO Achievement Chart" style="max-width: 100%; height: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating chart:', error);
    return '';
  }
}

export interface AssessmentReportProps {
  course: {
    course_name: string;
    level: number;
    section: string;
    academic_year: string;
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
  assessmentData: {
    students: Array<{
      studentId: string;
      studentName: string;
      cloScores: {
        [cloId: string]: {
          marksScored: number;
          totalMarks: number;
        };
      };
      totalMarksObtained: number;
    }>;
    cloScores: {
      [cloId: string]: number;
    };
    achievementData: {
      [percentage: string]: Array<{
        clo: string;
        achievementGrade: string;
        percentageAchieving: string;
      }>;
    };
    sortedClos: string[];
  };
}

export async function generateAssessmentReportHTML(props: AssessmentReportProps): Promise<string> {
  const { course, college, assessmentData } = props;
  const { sortedClos, achievementData } = assessmentData;
  
  function escapeHTML(str: string): string {
    return str.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Generate the chart HTML
  const chartHtml = await generateAchievementChartHTML(achievementData, sortedClos);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .h2_class { text-align: center; margin-bottom: 30px;,margin:auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 100%; height: auto; }
          .title { font-size: 20px; margin: 20px 0; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid black;
            padding: 10px;
            font-size: 11px;
            text-align: center;
            page-break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-inside: avoid !important;
          }
          .achievement-row { 
            background-color: #8b6b9f; 
            color: white;
          }
          .achievement-row td {
            border: 1px solid black;
            padding-left: 8px;
            padding-right: 8px;
            padding-top: 8px;
            padding-bottom: 16px;
          }
          .achievement-pair tr:first-child td.achievement-label {
            border-bottom: 0px solid black;
          }
          .achievement-pair tr:last-child td.achievement-label {
            border-top: 0px solid black;
          }
          thead tr:first-child th:first-child {
            border-top-left-radius: 8px;
          }
          thead tr:first-child th:last-child {
            border-top-right-radius: 8px;
          }
          tbody:last-child tr:last-child td:first-child {
            border-bottom-left-radius: 8px;
          }
          tbody:last-child tr:last-child td:last-child {
            border-bottom-right-radius: 8px;
          }
          .serial-col { width: 50px; }
          .id-col { width: 100px; }
          .name-col { width: 200px; }
          .marks-col { width: 80px; }
          .clo-header { background-color: #e0e0e0;text-transform: uppercase; }
          .total-header { background-color: #d0d0d0; }
          .achievement-label { 
            font-weight: normal; 
            text-align: left;
            font-size: 14px;
            vertical-align: middle;
            padding-left: 10px;
            padding-right: 10px;
            padding-top: 10px;
            padding-bottom: 20px;
            font-family: Arial, sans-serif;
          }
          td p {
            margin: 0;
          }
          .course-details {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            justify-content: space-between;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
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

          .student-row {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            display: table-row !important;
          }
          tbody {
            page-break-before: auto;
            page-break-after: auto;
          }
          .chart-container {
            width: 100%;
            height: 400px;
          }
          /* Add these new styles */
          .report-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .chart-section {
            page-break-before: always;
            margin-top: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
           <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
           <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="report-section">
            <div class="header">
              <img src="${college.logo}" alt="College Logo" class="logo">
              <div class="course-details">

                <div class="detail-item">
                  <span class="detail-label">Course Code:</span> ${course.course_code}
                </div>

                <div class="detail-item">
                  <span class="detail-label">Course Name:</span> ${course.course_name} (${course.section.charAt(0).toUpperCase() + course.section.slice(1).toLowerCase()})
                </div>
                 <div class="detail-item">
                  <span class="detail-label">Credit Hours:</span> ${course.credit_hours + 'Hours'}
                </div>

                  <div class="detail-item">
                  <span class="detail-label">Level:</span> ${course.level || 'NA'}
                </div>

                <div class="detail-item">
                  <span class="detail-label">Semester:</span> ${course.semister === 1 ? "First Semester" : "Second Semester"} ($${course?.academic_year})
                </div>
                       <div class="detail-item">
                  <span class="detail-label">Course Co-ordinator:</span> ${course.coordinator}
                </div>
                
                
               
              </div>
            </div>

            <h2 class="h2_class">Course Learning Outcome (CLO) Achievement Report</h2>

            <table style="border-radius: 5px; overflow: hidden;">
              <thead>
                <tr>
                  <th rowspan="2" class="serial-col">S.No</th>
                  <th rowspan="2" class="id-col">ID</th>
                  <th rowspan="2" class="name-col">Name</th>
                  ${sortedClos.map(clo => `
                    <th class="clo-header">${clo.replace(/([a-zA-Z]+)(\d+)/, '$1 $2')}</th>
                  `).join('')}
                  <th rowspan="2" class="total-header">MARKS OBTAINED</th>
                </tr>
                <tr>
                  ${sortedClos.map(clo => `
                    <th class="marks-col">${assessmentData.cloScores[clo]}</th>
                  `).join('')}
                </tr>
              </thead>
                <tbody >
                  ${assessmentData.students.map((student, index) => {
                    return `
                    <tr class="student-row">
                      <td>${index + 1}</td>
                      <td>${escapeHTML(student.studentId)}</td>
                      <td>${escapeHTML(student.studentName)}</td>
                      ${sortedClos.map(clo => {
                        const totalScore = assessmentData.cloScores[clo];
                        const threshold = totalScore * 0.6;
                        const studentScore = student.cloScores[clo]?.marksScored || 0;
                        const isBelow = studentScore < threshold;
                        return `<td  style="background-color:${isBelow ? '#FD5D5F': 'white'} !important;">${isBelow ? `<p style="color:white">${studentScore.toFixed(2)}</p>` : `<p>${studentScore.toFixed(2)}</p>`}</td>`;
                      }).join('')}
                      <td>${student.totalMarksObtained.toFixed(2)}</td>
                    </tr>
                  `}).join('')}
                </tbody>

                <tbody class="achievement-pair">
                  <tr class="achievement-row">
                    <td colspan="3" class="achievement-label">Achievement Grades</td>
                    ${sortedClos.map(clo => {
    const totalScore = assessmentData.cloScores[clo];
    return `<td>${(totalScore * 0.6).toFixed(2)}</td>`;
  }).join('')}
                    <td>-</td>
                  </tr>
                  <tr class="achievement-row">
                    <td colspan="3" class="achievement-label">% of students scoring ≥ 60%</td>
                    ${sortedClos.map((clo, index) => {
    return `<td>${achievementData['60'][index].percentageAchieving}%</td>`;
  }).join('')}
                    <td>-</td>
                  </tr>
                </tbody>

             

              
 

              
            </table>
          </div>

          <div class="chart-section">
            ${chartHtml}
          </div>
        </div>
      </body>
    </html>
  `;
}