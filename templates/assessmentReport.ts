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
      [cloId: string]: number;  // Total marks for each CLO
    };
  };
}

export function generateAssessmentReportHTML(props: AssessmentReportProps): string {
  const { course, college, assessmentData } = props;

  // Sort CLOs by their number
  const sortedClos = Object.keys(assessmentData.cloScores).sort((a, b) => {
    const aNum = parseInt(a.replace(/[^\d]/g, ''));
    const bNum = parseInt(b.replace(/[^\d]/g, ''));
    return aNum - bNum;
  });

  // Calculate percentage of students achieving ≥60% for each CLO
  const cloAchievements = sortedClos.map(clo => {
    const totalMarksForClo = assessmentData.cloScores[clo];
    const studentsAchieving60Percent = assessmentData.students.filter(student => {
      const studentScore = student.cloScores[clo]?.marksScored || 0;
      const percentage = (studentScore / totalMarksForClo) * 100;
      return percentage >= 60;
    });
    
    const percentageAchieving60 = (studentsAchieving60Percent.length / assessmentData.students.length) * 100;
    return percentageAchieving60.toFixed(2);
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 100%; height: auto; }
          .title { font-size: 24px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { 
            border: 1px solid black; 
            padding: 10px; 
            font-size: 12px; 
            text-align: center; 
          }
          .achievement-pair {
            page-break-inside: avoid;
            break-inside: avoid;
            display: table-row-group;
          }
          .achievement-row { 
            background-color: #8b6b9f; 
            color: white;
          }
          .achievement-row td {
            border: 1px solid black;
          }
          .achievement-pair tr:first-child td.achievement-label {
            border-bottom: none;
          }
          .achievement-pair tr:last-child td.achievement-label {
            border-top: none;
          }
          tr:not(.achievement-row) td {
            border-left: 1px solid black;
            border-right: 1px solid black;
            border-top: none;
            border-bottom: none;
          }
          tr:not(.achievement-row):not(:last-child) td {
            border-bottom: 1px solid black;
          }
          .serial-col { width: 50px; }
          .id-col { width: 100px; }
          .name-col { width: 200px; }
          .marks-col { width: 80px; }
          .clo-header { background-color: #e0e0e0; }
          .total-header { background-color: #d0d0d0; }
          .achievement-label { 
            font-weight: normal; 
            text-align: left;
            font-size: 16px;
            vertical-align: middle;
            line-height: 1.5;
            padding: 20px;
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
            <h2>Course Learning Outcome (CLO) Achievement Report</h2>
            <div class="course-details">
              <div class="detail-item">
                <span class="detail-label">Department:</span> ${course.department}
              </div>
              <div class="detail-item">
                <span class="detail-label">Semester:</span> ${course.semister}
              </div>
              <div class="detail-item">
                <span class="detail-label">Course Code:</span> ${course.course_code}
              </div>
              <div class="detail-item">
                <span class="detail-label">Credit Hours:</span> ${course.credit_hours}
              </div>
              <div class="detail-item">
                <span class="detail-label">Course Title:</span> ${course.course_name}
              </div>
            </div>
          </div>

          <table style="border: 1px solid black; border-radius: 5px; overflow: hidden;">
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
                    <td>${student.studentId}</td>
                    <td>${student.studentName}</td>
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
                  ${sortedClos.map(clo => {
                    const totalScore = assessmentData.cloScores[clo];
                    const studentsAchieving = assessmentData.students.filter(student => {
                      const studentScore = student.cloScores[clo]?.marksScored || 0;
                      const percentage = (studentScore / totalScore) * 100;
                      return percentage >= 60;
                    });
                    return `<td>${((studentsAchieving.length / assessmentData.students.length) * 100).toFixed(2)}%</td>`;
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
                  ${sortedClos.map(clo => {
                    const totalScore = assessmentData.cloScores[clo];
                    const studentsAchieving = assessmentData.students.filter(student => {
                      const studentScore = student.cloScores[clo]?.marksScored || 0;
                      const percentage = (studentScore / totalScore) * 100;
                      return percentage >= 70;
                    });
                    return `<td>${((studentsAchieving.length / assessmentData.students.length) * 100).toFixed(2)}%</td>`;
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
                  ${sortedClos.map(clo => {
                    const totalScore = assessmentData.cloScores[clo];
                    const studentsAchieving = assessmentData.students.filter(student => {
                      const studentScore = student.cloScores[clo]?.marksScored || 0;
                      const percentage = (studentScore / totalScore) * 100;
                      return percentage >= 80;
                    });
                    return `<td>${((studentsAchieving.length / assessmentData.students.length) * 100).toFixed(2)}%</td>`;
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
                <tr class="achievement-row">
                  <td colspan="3" class="achievement-label">% of students scoring ≥ 90%</td>
                  ${sortedClos.map(clo => {
                    const totalScore = assessmentData.cloScores[clo];
                    const studentsAchieving = assessmentData.students.filter(student => {
                      const studentScore = student.cloScores[clo]?.marksScored || 0;
                      const percentage = (studentScore / totalScore) * 100;
                      return percentage >= 90;
                    });
                    return `<td>${((studentsAchieving.length / assessmentData.students.length) * 100).toFixed(2)}%</td>`;
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