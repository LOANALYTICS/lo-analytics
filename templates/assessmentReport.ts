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
          th, td { border: 1px solid black; padding: 8px; text-align: center; }
          th { background-color: #f0f0f0; }
          .serial-col { width: 50px; }
          .id-col { width: 100px; }
          .name-col { width: 200px; }
          .marks-col { width: 80px; }
          .clo-header { background-color: #e0e0e0; }
          .total-header { background-color: #d0d0d0; }
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

          <table>
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
              ${assessmentData.students.map((student, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${student.studentId}</td>
                  <td>${student.studentName}</td>
                  ${sortedClos.map(clo => `<td>${student.cloScores[clo]?.marksScored.toFixed(2) || '0.00'}</td>`).join('')}
                  <td>${student.totalMarksObtained.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
} 