interface AssessmentReportProps {
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
}

export function generateAssessmentReportHTML(props: AssessmentReportProps): string {
  const { course, college } = props;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        
        .header {
          width: 100%;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .college-logo {
          max-width: 100%;
          height: auto;
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
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${college.logo}" alt="College Logo" class="college-logo">
      </div>
      
      <div class="course-details">
        <div class="detail-item">
          <span class="detail-label">Department:</span>
          <span>${course.department}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Semester:</span>
          <span>${course.semister}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Course Code:</span>
          <span>${course.course_code}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Credit Hours:</span>
          <span>${course.credit_hours}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Course Title:</span>
          <span>${course.course_name}</span>
        </div>
      </div>
    </body>
    </html>
  `;
} 