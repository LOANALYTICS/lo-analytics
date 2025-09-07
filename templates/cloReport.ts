import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

async function generateAchievementChartHTML(achievementData: any, sortedClos: string[], indirectAssessmentData?: any): Promise<string> {
  const directChartData = sortedClos.map(clo => {
    const achievement = achievementData[60].find((a: any) => a.clo === clo);
    const value = achievement ? parseFloat(achievement.percentageAchieving) : 0;
    return value;
  });


  const indirectChartData = indirectAssessmentData ? sortedClos.map(clo => {
    const assessment = indirectAssessmentData.indirectAssessments.find((a: any) => a.clo.replace(/\s/g, '').toUpperCase() === clo.replace(/\s/g, '').toUpperCase());
    const value = assessment ? parseFloat(assessment.achievementPercentage) : 0;
    return value;
  }) : [];

 
  const labels = sortedClos.map(clo => clo.toUpperCase());
  
  const chartConfig = encodeURIComponent(JSON.stringify({
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Direct Assessment Achievement',
          data: directChartData,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          barThickness: 30,
          borderRadius: 4,
          categoryPercentage: 0.7,
          barPercentage: 0.7
        },
        {
          label: 'Indirect Assessment Achievement',
          data: indirectChartData,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          barThickness: 30,
          borderRadius: 4,
          categoryPercentage: 0.7,
          barPercentage: 0.7
        },
        {
          label: 'Direct Threshold (60%)',
          data: Array(sortedClos.length).fill(60),
          type: 'line',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        },
        {
          label: `Indirect Threshold (${indirectAssessmentData?.indirectAssessments[0]?.benchmark}%)`,
          data: Array(sortedClos.length).fill(indirectAssessmentData?.indirectAssessments[0]?.benchmark),
          type: 'line',
          borderColor: 'rgba(153, 102, 255, 1)',
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
      layout: {
        overflow:'visible',
        padding: {
          top: 20
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 10,
              font: {
                size: 12,
                weight: 'bold'
              }
          }
        },
        annotation: {
          annotations: {
            ...directChartData.reduce((acc, value, index) => ({
              ...acc,
              [`label${index}`]: {
                type: 'label',
                xValue: index,
                yValue: value,
                content: Math.round(value) + '%',
                color: '#000',
                font: {
                  weight: 'bold',
                  size: 12
                },
                yAdjust: -10,
                xAdjust: -20
              }
              
            }), {}),
            ...indirectChartData.reduce((acc, value, index) => ({
              ...acc,
              [`indirectLabel${index}`]: {
                type: 'label',
                xValue: index,
                yValue: Number(value) < 50 ? 50 :value,
                content: Math.round(value) + '%',
                color: '#000',
                font: {
                  weight: 'bold',
                  size: 12
                },
                yAdjust: -10,
                xAdjust: 20
              }
            }), {})
          }
        }
      },
      scales: {
        y: {
          min: 50,
          max: 105,
          ticks: {
            stepSize: 5,
              font: {
                size: 12,
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
              size: 16,
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
                size: 12,
                weight: 'bold'
              }
          },
          title: {
            display: true,
            text: 'Course Learning Outcomes (CLOs)',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    }
  }));

  const chartUrl = `https://quickchart.io/chart?c=${chartConfig}&w=1100&h=650&format=base64&v=${Date.now()}&backgroundColor=white&devicePixelRatio=2&plugins=chartjs-plugin-annotation`;
  
  try {
    const response = await fetch(chartUrl);
    const base64Image = await response.text();
    
    return `
      <div class="chart-container">
        <h3 class="chart-title">CLO Achievement Chart</h3>
        <div class="chart-wrapper">
          <img src="data:image/png;base64,${base64Image}" alt="CLO Achievement Chart" class="chart-image">
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating chart:', error);
    return '';
  }
}

export interface CloReportProps {
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
  indirectAssessmentData?: {
    indirectAssessments: Array<{
      clo: string;
      achievementRate: number;
      benchmark: string;
      achievementPercentage: number;
    }>;
  };
}

export async function generateCloReportHTML(props: CloReportProps): Promise<string> {
  const { course, college, assessmentData, indirectAssessmentData } = props;
  const { sortedClos, achievementData } = assessmentData;
  
  function escapeHTML(str: string): string {
    return str.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Generate the chart HTML
  const chartHtml = await generateAchievementChartHTML(achievementData, sortedClos, indirectAssessmentData);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 100%; 
            margin: 0 auto; 
            padding: 20px;
          }
          .h2_class { 
            text-align: center; 
            margin: 10px 0;
            font-size: 1.8em;
            font-weight:800;
          }
          .chart-title {
            text-align: center;
            margin: 10px 0;
            font-size: 1.3em;
            font-weight: 500;
            font-weight: bold;
          }
          .header {
            width: 100%;
            margin-bottom: 15px;
          }
          .logo {
            width: auto;
            max-width: 100%;
            max-height: 180px;
            height: 180px;
            object-fit: contain;
            margin-bottom: 15px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .course-details {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: space-between;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            padding: 8px;
            padding-bottom:16px !important;
            border-radius: 3px;
          }
          .detail-item {
            display: flex;
            gap: 3px;
            font-size: 1.3em;
            white-space: nowrap;
            flex: 1 1 30%;
          }
          .detail-label {
            font-weight: bold;
            white-space: nowrap;
          }
          .title { 
            font-size: 18px; 
            margin: 10px 0; 
          }
          table { 
            width: auto; 
            min-width: 100%;
            border-collapse: collapse; 
            margin-top: 10px;
            font-weight: 500;
            table-layout: auto;
          }
          th, td { 
            border: 1px solid black;
            padding: 6px;
            padding-bottom:12px;
            font-size: 1.2em;
            font-weight: 500;
            text-align: center;
          }
          tr {
            break-inside: avoid !important;
          }
                         tr th {
            font-size: 1.2em;
            font-weight: 700;
            }
          .achievement-row { 
            background-color: #8b6b9f; 
            color: white;
          }
          .achievement-row td {
            border: 1px solid black;
            padding: 4px;
            padding-bottom:10px;
          }
          .achievement-pair tr:first-child td.achievement-label {
            border-bottom: 0px solid black;
          }
          .achievement-pair tr:last-child td.achievement-label {
            border-top: 0px solid black;
          }
          thead tr:first-child th:first-child {
            border-top-left-radius: 4px;
          }
          thead tr:first-child th:last-child {
            border-top-right-radius: 4px;
          }
          tbody:last-child tr:last-child td:first-child {
            border-bottom-left-radius: 4px;
          }
          tbody:last-child tr:last-child td:last-child {
            border-bottom-right-radius: 4px;
          }
          .serial-col { width: 45px; min-width: 45px; }
          .id-col { width: 90px; min-width: 90px; }
          .name-col { width: 220px; min-width: 220px; }
          .marks-col { width: 65px; min-width: 65px; }
          .clo-header { 
            background-color: #e0e0e0;
            text-transform: uppercase; 
            font-size: 1.3em;
            font-weight: 700;
            width: 75px;
            min-width: 75px;
          }
          .total-header { 
            background-color: #d0d0d0;
            width: 80px;
            min-width: 80px;
            font-size: 1.3em;
          }
          .achievement-label { 
            font-weight: normal; 
            text-align: left;
            font-size: 1.1em;
            font-weight: 500;
            vertical-align: middle;
            padding: 4px;
            font-family: Arial, sans-serif;
          }
          td p {
            margin: 0;
          }
          .student-row {
            break-inside: avoid !important;
            display: table-row !important;
          }
          .chart-container {
            margin-top: 20px;
            text-align: center;
            min-height: 650px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .chart-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 650px;
            width: 100%;
          }
          .chart-image {
            width: 75%;
            max-width: 100%;
            height: auto;
            max-height: 650px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin: 0 auto;
            object-fit: contain;
            aspect-ratio: 1100/650;
          }
          .assessment-type-label {
            font-weight: bold;
            background-color: #8b6b9f;
            color: white;
            padding: 3px;
            border-right: 1px solid black;
            white-space: nowrap;
            height: 100%;
            font-size: 1.2em;
            font-weight: 500;
            position: relative;
            text-align: center;
          }
          .vertical-text-container {
            position: absolute;
            text-align: center;
            top: 60%;
            left: 40%;
            transform: translate(-50%, -20%) rotate(-90deg);
            white-space: wrap;
            width: 30px;
            height: max-content;
            transform-origin: center center;
            font-size: 12.5px;
          }
          .table-section {
            flex: 1;
            overflow: hidden;
          }
          .chart-section {
            flex-shrink: 0;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${college.logo}" alt="College Logo" class="logo">
            <div class="course-details">
               <div class="detail-item">
                  <span class="detail-label">Course Name:</span> ${course.course_name} (${course.section.charAt(0).toUpperCase() + course.section.slice(1).toLowerCase()})
                </div>
                <div class="detail-item">
                  <span class="detail-label">Course Code:</span> ${course.course_code}
                </div>
             
                <div class="detail-item">
                  <span class="detail-label">Credit Hours:</span> ${course.credit_hours + 'Hours'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Level:</span> ${course.level || 'NA'}
                </div>
                <div class="detail-item">
                  <span class="detail-label">Semester:</span> ${course.semister === 1 ? "First Semester" : "Second Semester"} (${course?.academic_year})
                </div>
                <div class="detail-item">
                  <span class="detail-label">Course Co-ordinator:</span> ${course.coordinator}
                </div>
            </div>
          </div>

          <h2 class="h2_class">Course Learning Outcome (CLO) Achievement Report</h2>

          <div class="table-section">
            <table style="border-radius: 3px; overflow: hidden;">
              <thead>
                <tr>
                  <th rowspan="2" class="serial-col">S.No</th>
                  <th rowspan="2" class="id-col">ID</th>
                  <th rowspan="2" class="name-col">Name</th>
                  ${sortedClos.map(clo => `
                    <th class="clo-header">${clo.replace(/([a-zA-Z]+)(\d+)/, '$1 $2')}</th>
                  `).join('')}
                </tr>
                <tr>
                  ${sortedClos.map(clo => `
                    <th class="marks-col">${assessmentData.cloScores[clo]}</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
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
                      return `<td style="background-color:${isBelow ? '#e6ffe6': 'white'} !important;">${isBelow ? `<p >${studentScore.toFixed(2)}</p>` : `<p>${studentScore.toFixed(2)}</p>`}</td>`;
                    }).join('')}
                  </tr>
                `}).join('')}
              </tbody>
          

              <tbody class="achievement-pair">
                <tr class="achievement-row">
                  <td rowspan="2" class="assessment-type-label">
                    <div class="vertical-text-container">Direct Assessment</div>
                  </td>
                  <td colspan="2" class="achievement-label">Achievement Grades</td>
                  ${sortedClos.map(clo => {
    const totalScore = assessmentData.cloScores[clo];
    return `<td>${(totalScore * 0.6).toFixed(2)}</td>`;
  }).join('')}
                </tr>
                <tr class="achievement-row">
                  <td colspan="2" class="achievement-label">% of students scoring ≥ 60%</td>
                  ${sortedClos.map((clo, index) => {
    return `<td>${Number(achievementData['60'][index].percentageAchieving).toFixed(1)}%</td>`;
  }).join('')}
                </tr>
              </tbody>

              ${indirectAssessmentData ? `
              <tbody class="achievement-pair">
                <tr class="achievement-row">
                  <td rowspan="2" class="assessment-type-label">
                    <div class="vertical-text-container">Indirect Assessment</div>
                  </td>
                  <td colspan="2" class="achievement-label">Achievement Rate</td>
                  ${sortedClos.map(() => `<td>80.00</td>`).join('')}
                </tr>
                <tr class="achievement-row">
                  <td colspan="2" class="achievement-label">% of students agreed that they achieved the CLO</td>
                  ${sortedClos.map(clo => {
                    const assessment = indirectAssessmentData.indirectAssessments.find(
                      (a: any) => a.clo.replace(/\s/g, '').toUpperCase() === clo.replace(/\s/g, '').toUpperCase()
                    );
                    return `<td>${assessment ? assessment.achievementPercentage.toFixed(1) + '%' : '-'}</td>`;
                  }).join('')}
                </tr>
              </tbody>
              ` : ''}
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

