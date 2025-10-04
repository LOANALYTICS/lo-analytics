import { Chart, registerables } from 'chart.js';

// Register Chart.js components (kept for compatibility elsewhere)
Chart.register(...registerables);

function generateAchievementChartSVG(
  labels: string[],
  direct: number[],
  indirect: number[],
  indirectBenchmark: number,
  directBenchmark: number = 60
): string {
  const width = 1400;
  const height = 620;
  // Bottom legend space maintained; slightly wider layout
  const margin = { top: 50, right: 30, bottom: 150, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const yMin = 50;
  const yMax = 108; // extra headroom so value labels have clear space from top
  const yToPx = (v: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, v));
    const t = (clamped - yMin) / (yMax - yMin);
    return margin.top + (1 - t) * plotHeight;
  };

  const groupCount = labels.length;
  const groupSpacing = plotWidth / Math.max(1, groupCount);
  // Make bars fill the group more and remove gap between direct/indirect
  const barWidth = Math.min(52, Math.max(28, groupSpacing * 0.42));
  const seriesGap = 0; // no gap between the two bars in a group

  const xForGroup = (i: number) => margin.left + i * groupSpacing + groupSpacing / 2;

  const gridLines: string[] = [];
  for (let y = yMin; y <= yMax; y += 5) {
    const py = yToPx(y);
    gridLines.push(`<line x1="${margin.left}" y1="${py}" x2="${margin.left + plotWidth}" y2="${py}" stroke="rgba(0,0,0,0.1)"/>`);
  }

  const xAxis = `<line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#000" stroke-width="1"/>`;
  const yAxis = `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#000" stroke-width="1"/>`;

  const bars: string[] = [];
  const labelsSvg: string[] = [];

  labels.forEach((label, i) => {
    const cx = xForGroup(i);
    const values = [direct[i] ?? 0, indirect[i] ?? 0];
    const colors = ['rgba(54, 162, 235, 0.8)', 'rgba(75, 192, 192, 0.8)'];
    const borders = ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'];
    const offsets = [-barWidth / 2 - seriesGap / 2, barWidth / 2 + seriesGap / 2];
    values.forEach((v, si) => {
      const x = cx + offsets[si] - barWidth / 2;
      const y = yToPx(v);
      const h = margin.top + plotHeight - y;
      bars.push(`<rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(0, h)}" fill="${colors[si]}" stroke="${borders[si]}" stroke-width="1" rx="4"/>`);
      const valText = Number.isInteger(v) ? String(v) : v.toFixed(1);
      labelsSvg.push(`<text x="${cx + offsets[si]}" y="${y - 12}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#000">${valText}%</text>`);
    });

    // X tick label
    labelsSvg.push(`<text x="${cx}" y="${margin.top + plotHeight + 20}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold">${label}</text>`);
  });

  const thresholdDirectY = yToPx(directBenchmark);
  const thresholdIndirectY = yToPx(indirectBenchmark);
  const dash = '5,5';
  const thresholds = `
    <line x1="${margin.left}" y1="${thresholdDirectY}" x2="${margin.left + plotWidth}" y2="${thresholdDirectY}" stroke="rgba(255,99,132,0.9)" stroke-width="3" stroke-dasharray="${dash}"/>
    <line x1="${margin.left}" y1="${thresholdIndirectY}" x2="${margin.left + plotWidth}" y2="${thresholdIndirectY}" stroke="rgba(153,102,255,0.9)" stroke-width="3" stroke-dasharray="${dash}"/>
  `;

  // Y-axis ticks
  const yTicks: string[] = [];
  for (let y = yMin; y <= yMax; y += 5) {
    const py = yToPx(y);
    yTicks.push(`<text x="${margin.left - 8}" y="${py + 4}" text-anchor="end" font-family="Arial" font-size="18" font-weight="bold">${y}</text>`);
  }

  // Bottom-centered legend with four entries: direct, indirect, and thresholds
  const legendGroupY = height - 38; // lift legend by 12px from original to avoid clipping
  const legendItems: string[] = [];
  const col1x = margin.left + 120;
  const col2x = margin.left + Math.floor(plotWidth / 2) + 40;

  const addLegendRectAt = (x: number, y: number, colorFill: string, colorStroke: string, label: string) => {
    legendItems.push(`<rect x="${x}" y="${y - 12}" width="16" height="12" fill="${colorFill}" stroke="${colorStroke}"/>`);
    legendItems.push(`<text x="${x + 22}" y="${y}" font-family="Arial" font-size="20" font-weight="bold">${label}</text>`);
  };
  const addLegendDashAt = (x: number, y: number, stroke: string, label: string) => {
    legendItems.push(`<line x1="${x}" y1="${y - 6}" x2="${x + 26}" y2="${y - 6}" stroke="${stroke}" stroke-width="2" stroke-dasharray="5,5"/>`);
    legendItems.push(`<text x="${x + 32}" y="${y}" font-family="Arial" font-size="20" font-weight="bold">${label}</text>`);
  };

  // first row
  const ly1 = legendGroupY;
  addLegendRectAt(col1x, ly1, 'rgba(54,162,235,0.8)', 'rgba(54,162,235,1)', 'Direct Assessment Achievement');
  addLegendRectAt(col2x, ly1, 'rgba(75,192,192,0.8)', 'rgba(75,192,192,1)', 'Indirect Assessment Achievement');
  // second row
  const ly2 = legendGroupY + 28;
  addLegendDashAt(col1x, ly2, 'rgba(255,99,132,1)', `Direct Threshold (${directBenchmark}%)`);
  addLegendDashAt(col2x, ly2, 'rgba(153,102,255,1)', `Indirect Threshold (${indirectBenchmark}%)`);

  const legend = `<g style="font-size: 20px;">${legendItems.join('')}</g>`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
    <g>
      ${gridLines.join('')}
      ${xAxis}
      ${yAxis}
      ${yTicks.join('')}
    </g>
    ${thresholds}
    <g>
      ${bars.join('')}
      ${labelsSvg.join('')}
    </g>
    <text x="${margin.left + plotWidth / 2}" y="${margin.top + plotHeight + 68}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="bold">Course Learning Outcomes (CLOs)</text>
    <!-- Rotated Y-axis label -->
    <g transform="translate(${margin.left - 45}, ${margin.top + plotHeight / 2}) rotate(-90)">
      <text text-anchor="middle" font-family="Arial" font-size="26" font-weight="bold">Percentage</text>
    </g>
    ${legend}
  </svg>`;
}

async function generateAchievementChartHTML(achievementData: any, sortedClos: string[], benchmark: any, indirectAssessmentData?: any): Promise<string> {
  const directChartData = sortedClos.map(clo => {
    const achievement = achievementData[60].find((a: any) => a.clo === clo);
    const value = achievement ? parseFloat(achievement.percentageAchieving) : 0;
    return value;
  });


  const indirectChartData = indirectAssessmentData ? sortedClos.map(clo => {
    // Extract CLO number from "clo1" -> "1"
    const cloNumber = clo.replace(/^clo/i, '');
    const assessment = indirectAssessmentData.indirectAssessments.find((a: any) => a.clo === cloNumber);
    const value = assessment ? parseFloat(assessment.achievementPercentage) : 0;
    return value;
  }) : [];


  const labels = sortedClos.map(clo => clo.toUpperCase());
  const directRounded = directChartData.map(v => Number(Number(v).toFixed(1)));
  const indirectRounded = indirectChartData.map(v => Number(Number(v).toFixed(1)));

  const indirectBenchmark = Number(indirectAssessmentData?.indirectAssessments?.[0]?.benchmark ?? 80);
  const directBenchmark = Number(benchmark ?? 60);
  const svg = generateAchievementChartSVG(labels, directRounded, indirectRounded, indirectBenchmark, directBenchmark);

  return `
    <div class="chart-container">
      <h3 class="chart-title">CLO Achievement Chart</h3>
      <div class="chart-wrapper">
        ${svg}
      </div>
    </div>
  `;
}

type CloDiagnostic = {
  cloNumber: string;
  cloText: string;
  mappedPLOs: string[];
  achievementGrade: string | number;
  percentageAchieving: string | number;
};

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
  plogroups?: {
    knowledge: Array<{
      cloNumber: string;
      cloText: string;
      mappedPLOs: string[];
      weightage: number | null;
      direct: { achievementGrade: string; percentageAchieving: string };
      indirect: { achievementGrade: string; percentageAchieving: string };
    }>;
    skills: Array<{
      cloNumber: string;
      cloText: string;
      mappedPLOs: string[];
      weightage: number | null;
      direct: { achievementGrade: string; percentageAchieving: string };
      indirect: { achievementGrade: string; percentageAchieving: string };
    }>;
    values: Array<{
      cloNumber: string;
      cloText: string;
      mappedPLOs: string[];
      weightage: number | null;
      direct: { achievementGrade: string; percentageAchieving: string };
      indirect: { achievementGrade: string; percentageAchieving: string };
    }>;
  };
  benchmark?: number;
}

export async function generateCloReportHTML(props: CloReportProps): Promise<string> {
  const { course, college, assessmentData, indirectAssessmentData, plogroups, benchmark } = props;

  const { sortedClos, achievementData } = assessmentData;

  function escapeHTML(str: string): string {
    return str.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Generate the chart HTML
  const chartHtml = await generateAchievementChartHTML(achievementData, sortedClos, benchmark, indirectAssessmentData);

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
      return `<td>${isBelow ? `<p style="color: #d32f2f;">${studentScore.toFixed(2)}</p>` : `<p>${studentScore.toFixed(2)}</p>`}</td>`;
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
                  ${sortedClos.map(clo => {
      // Extract CLO number from "clo1" -> "1"
      const cloNumber = clo.replace(/^clo/i, '');
      const assessment = indirectAssessmentData.indirectAssessments.find(
        (a: any) => a.clo === cloNumber
      );
      return `<td>${assessment ? assessment.benchmark : '80.00'}</td>`;
    }).join('')}
                </tr>
                <tr class="achievement-row">
                  <td colspan="2" class="achievement-label">% of students agreed that they achieved the CLO</td>
                  ${sortedClos.map(clo => {
      // Extract CLO number from "clo1" -> "1"
      const cloNumber = clo.replace(/^clo/i, '');
      const assessment = indirectAssessmentData.indirectAssessments.find(
        (a: any) => a.clo === cloNumber
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

