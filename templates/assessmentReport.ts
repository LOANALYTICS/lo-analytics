export interface AssessmentReportProps {
  course: {
    course_name: string;
    level: number;
    semister: number;
    department: string;
    course_code: string;
    credit_hours: string;
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

export function generateAssessmentReportHTML(props: AssessmentReportProps): string {
  const { course, college, assessmentData } = props;
  const { sortedClos, achievementData } = assessmentData;
  function escapeHTML(str: string): string {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // // Calculate percentage of students achieving ≥60% for each CLO
  // const cloAchievements = sortedClos.map(clo => {
  //   const totalMarksForClo = assessmentData.cloScores[clo];
  //   const studentsAchieving60Percent = assessmentData.students.filter(student => {
  //     const studentScore = student.cloScores[clo]?.marksScored || 0;
  //     const percentage = (studentScore / totalMarksForClo) * 100;
  //     return percentage >= 60;
  //   });
    
  //   const percentageAchieving60 = (studentsAchieving60Percent.length / assessmentData.students.length) * 100;
  //   return percentageAchieving60.toFixed(2);
  // });

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
          .clo-header { background-color: #e0e0e0;text-transform: capitalize; }
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
          .course-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .detail-item {
            display: flex;
            gap: 5px;
            font-size: 14px;
          }
          .detail-label {
            font-weight: bold;
          }
          .student-group {
            page-break-inside: auto;
            break-inside: auto;
          }
          .student-row {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          tbody {
            page-break-before: auto;
            page-break-after: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${college.logo}" alt="College Logo" class="logo">
            
            <div class="course-details">
             <div class="detail-item">
                <span class="detail-label">Course Title:</span> ${course.course_name}
              </div>
              <div class="detail-item">
                <span class="detail-label">Semester:</span> ${course.semister === 1 ? "First Semester" : "Second Semester"}
              </div>
               <div class="detail-item">
                <span class="detail-label">Course Code:</span> ${course.course_code}
              </div>
               <div class="detail-item">
                <span class="detail-label">Department:</span> ${course.department}
              </div>
              <div class="detail-item">
                <span class="detail-label">Credit Hours:</span> ${course.credit_hours + 'Hours'}
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
                  <th class="clo-header">${clo}</th>
                `).join('')}
                <th rowspan="2" class="total-header">MARKS OBTAINED</th>
              </tr>
              <tr>
                ${sortedClos.map(clo => `
                  <th class="marks-col">${assessmentData.cloScores[clo]}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <tbody class="student-group">
                ${assessmentData.students.map((student, index) => `
                  <tr class="student-row">
                    <td>${index + 1}</td>
                    <td>${escapeHTML(student.studentId)}</td>
                    <td>${escapeHTML(student.studentName)}</td>
                    ${sortedClos.map(clo => `<td>${student.cloScores[clo]?.marksScored.toFixed(2) || '0.00'}</td>`).join('')}
                    <td>${student.totalMarksObtained.toFixed(2)}</td>
                  </tr>
                `).join('')}
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

<tbody class="achievement-pair">
  <tr class="achievement-row">
    <td colspan="3" class="achievement-label">Achievement Grades</td>
    ${sortedClos.map(clo => {
      const totalScore = assessmentData.cloScores[clo];
      return `<td>${(totalScore * 0.7).toFixed(2)}</td>`;
    }).join('')}
    <td>-</td>
  </tr>
  <tr class="achievement-row">
    <td colspan="3" class="achievement-label">% of students scoring ≥ 70%</td>
    ${sortedClos.map((clo, index) => {
      return `<td>${achievementData['70'][index].percentageAchieving}%</td>`;
    }).join('')}
    <td>-</td>
  </tr>
</tbody>

<tbody class="achievement-pair">
  <tr class="achievement-row">
    <td colspan="3" class="achievement-label">Achievement Grades</td>
    ${sortedClos.map(clo => {
      const totalScore = assessmentData.cloScores[clo];
      return `<td>${(totalScore * 0.8).toFixed(2)}</td>`;
    }).join('')}
    <td>-</td>
  </tr>
  <tr class="achievement-row">
    <td colspan="3" class="achievement-label">% of students scoring ≥ 80%</td>
    ${sortedClos.map((clo, index) => {
      return `<td>${achievementData['80'][index].percentageAchieving}%</td>`;
    }).join('')}
    <td>-</td>
  </tr>
</tbody>

<tbody class="achievement-pair">
  <tr class="achievement-row">
    <td colspan="3" class="achievement-label">Achievement Grades</td>
    ${sortedClos.map(clo => {
      const totalScore = assessmentData.cloScores[clo];
      return `<td>${(totalScore * 0.9).toFixed(2)}</td>`;
    }).join('')}
    <td>-</td>
  </tr>
  <tr class="achievement-row" >
    <td colspan="3" class="achievement-label">% of students scoring ≥ 90%</td>
    ${sortedClos.map((clo, index) => {
      return `<td>${achievementData['90'][index].percentageAchieving}%</td>`;
    }).join('')}
    <td>-</td>
  </tr>
</tbody>

            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
}