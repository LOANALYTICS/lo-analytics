import { Chart, registerables } from 'chart.js';
import { createCanvas } from 'canvas';

// Register Chart.js components
Chart.register(...registerables);

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
                ${generateGradeDistributionChartHTML(assessmentData)}
            </div>
        </body>
    </html>`;
}

function generateGradeDistributionChartHTML(assessmentData: Record<string, GradeCount>): string {
  const gradeColors = {
    'A+': 'rgb(0, 102, 204)',     // Strong Blue
    'A': 'rgb(51, 153, 255)',     // Light Blue
    'B+': 'rgb(102, 51, 153)',    // Deep Purple
    'B': 'rgb(153, 102, 255)',    // Medium Purple
    'C+': 'rgb(255, 128, 0)',     // Orange
    'C': 'rgb(255, 178, 102)',    // Light Orange
    'D+': 'rgb(255, 51, 51)',     // Red
    'D': 'rgb(255, 102, 102)',    // Light Red
    'F': 'rgb(128, 128, 128)'     // Gray
  };

  const labels = Object.keys(assessmentData);
  const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
  
  const datasets = grades.map(grade => ({
    label: grade,
    data: labels.map(type => {
      const total = Object.values(assessmentData[type]).reduce<number>((sum, count) => sum + count, 0);
      return ((assessmentData[type][grade as keyof GradeCount] / total) * 100).toFixed(1);
    }),
    backgroundColor: gradeColors[grade as keyof typeof gradeColors],
    barPercentage: 0.8,
    categoryPercentage: 0.9
  }));

  const canvas = createCanvas(1000, 500);
  const ctx = canvas.getContext('2d');

  const chart = new Chart(ctx as unknown as CanvasRenderingContext2D, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: false,
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            },
            stepSize: 10,
            font: {
              size: 12
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  });

  // Add percentage labels on top of the bars
  datasets.forEach((dataset, datasetIndex) => {
    dataset.data.forEach((value, index) => {
      const numValue = parseFloat(value as string);
      const meta = chart.getDatasetMeta(datasetIndex);
      const bar = meta.data[index];
      ctx.fillStyle = 'black';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${numValue}%`,
        bar.x,
        bar.y - 5  // Position above the bar
      );
    });
  });

  const chartImage = canvas.toDataURL('image/png');
  chart.destroy();

  return `
    <div style="break-inside: avoid; page-break-inside: avoid;">
      <h2 style="text-align: center;">Grade Distribution Chart</h2>
      <div style="text-align: center;">
        <img src="${chartImage}" alt="Grade Distribution Chart" style="max-width:1000px; height:auto; border: 1px solid #ccc;"/>
      </div>
    </div>
  `;
}
