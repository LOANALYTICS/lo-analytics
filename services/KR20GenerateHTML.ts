export function generateHTML(data: any): string {
  const { 
    groupedItemAnalysisResults = [], 
    KR_20 = 0, 
    segregatedGradedStudents = [], 
    course = {}, 
    collegeInfo = {} 
  } = data || {};

  // Interpret KR-20 Reliability score
  const getKR20Message = (kr20: number): string => {
    if (kr20 >= 0.90) return "Excellent reliability; at the level of the best standardized tests.";
    if (kr20 >= 0.85) return "Exam seems to be Very Good and reliable.";
    if (kr20 >= 0.80) return "Exam seems to be Good and reliable.";
    if (kr20 >= 0.71) return "Value lies between the marginally acceptable ranges. Items could be improved.";
    if (kr20 >= 0.61) return "Somewhat low. Supplement with other measures for grading.";
    if (kr20 >= 0.51) return "Revision needed. Supplement with more tests.";
    return "Questionable reliability. Revision is needed.";
  };

  const getCommentByClassification = (classification: string): string => {
    if (classification === 'Reliability') return getKR20Message(KR_20);
    
    switch (classification) {
      case 'Poor (Bad) Questions':
        return 'All the questions should be rejected.';
      case 'Very Difficult Questions':
        return 'Keys of these items are needed to be checked.';
      case 'Difficult Questions':
        return 'Items should be rejected.';
      case 'Good Questions':
        return 'Key of this item is also needed to be checked.';
      case 'Easy Questions':
        return 'Items could be stored in question bank for further use.';
      case 'Very Easy Questions':
        return 'Item should be revised before re-use.';
    
      default:
        return '';
    }
  };
  
  // Add this helper function before the return statement
  const formatQuestions = (questions: any[]): string => {
    const questionNumbers = questions.map(q => q?.question || '');
    const chunks: string[] = [];
    
    for (let i = 0; i < questionNumbers.length; i += 20) {
      chunks.push(questionNumbers.slice(i, i + 20).join(", "));
    }
    
    return chunks.join("<br>");
  };

  // Generate HTML
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Item Analysis Report</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        padding: 60px; 
        min-width: max-content;
      }
      header { 
        text-align: center; 
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .logo { 
        width: 150px; 
        height: auto;
        display: block;
        margin: 0 auto 10px;  /* Added margin-bottom for spacing */
      }
      .table { 
        width: 100%;
        min-width: max-content;
        border-collapse: collapse; 
        margin: 20px 0; 
        border: 1px solid #000 !important;
      }
      .table th, .table td { 
        border: 1px solid #000; 
        padding: 8px 8px 8px 8px; 
        text-align: center;
        white-space: nowrap;
        height: 100%;
        vertical-align: middle !important;
        text-align: center !important;
        padding: 8px !important;
      }
      .table td p, .table th p {
        margin-bottom: 10px;
        text-align: center;
      }
      .section-title { font-weight: bold; font-size: 18px; margin-top: 20px; }
      .info-box { padding: 10px; border: 1px solid #000; margin: 10px 0; }
      .grade-cell { display: flex; flex-direction: column; align-items: center; }
      .grade-cell span { margin: 2px 0; }
      .split-cell {
        padding: 0 !important;
      }
      .cell-row {
        padding: 4px 4px 4px 4px;
        border-bottom: 1px solid #333;
        min-height: 24px;
        line-height: 1.2;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 24px !important;
      }
      .cell-row:last-child {
        border-bottom: none;
      }
      .question-no-cell {
        white-space: normal !important;
        min-width: 300px;
        max-width: 300px;
        word-wrap: break-word;
        text-align: left;
        padding: 8px 8px 20px 8px !important;
        vertical-align: top;
        line-height: 1.4;
        overflow-wrap: break-word;
      }
      .question-no-cell p {
        text-align: left;
        margin-bottom: 10px;
      }
      .course-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;  /* Creates 2 equal columns */
        grid-template-rows: repeat(3, auto);  /* Creates 3 rows */
      }
      .grid-item {
        padding: 2px;
        text-align: start;
      }
      .header-container {
        margin-bottom: 80px;
      }
      .header {
        text-align: center;
        padding: 4px;
        margin-bottom: 10px;
      }
      .header-description {
        max-width: fit-content;
        margin: 0 auto;
      }
      .header-description h2 {
        font-size: 24px;
        text-align: center;
      }
      .header-description hr {
        margin-top: 10px;
      }
      .header-description p {
        font-size: 20px;
        margin-top: -8px;
        text-align: center;
      }
      .college-logo {
        max-width: 200px;
        margin: 0 auto;
        aspect-ratio: 16/9;
      }
      .college-name {
        font-size: 40px;
        font-weight: bold;
      }
      .university-name {
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <!-- Header with Logo and College Information -->
    <div class="header-container">
      <div class="header">
        ${collegeInfo.logo ? `<img src="${collegeInfo.logo}" alt="College Logo" class="college-logo"/>` : ''}
        <div class="college-name">
          ${collegeInfo.english} | ${collegeInfo.regional}
        </div>
        <div class="university-name">${collegeInfo.university}</div>
      </div>
      <hr style="margin-bottom: 40px;"/>
      <div class="header-description">
        <h2>Item Analysis Report</h2>
        <hr/>
        <p>Course: ${course.course_name || ''}</p>
      </div>
    </div>


    <!-- Course Details Section -->
    <div class="info-box  rounded-md overflow-hidden  border-collapse border border-black">
      <div class="course-grid">
        <div class="grid-item">
          <p><span style="font-weight: bold;">Course Name:</span> ${course?.course_name || ''}</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Course Code:</span> ${course?.course_code || ''}</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Credit Hour:</span> ${course?.credit_hours || ''}</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Level:</span> ${course?.level || ''}</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Semister:</span> ${course?.semister === 1 ? 'First Semester' : 'Second Semester'}</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Course Coordinator:</span> ${course?.coordinator || ''}</p>
        </div>
      </div>
    </div>

    <table class="table rounded-md overflow-hidden border-collapse border border-black">
      <tr>
        <th><p style="text-align: center; margin-bottom: 10px;">S.No</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Item Category</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Question No</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Total Questions</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">%</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Comments/Recommendations</p></th>
      </tr>
      ${(groupedItemAnalysisResults || [])?.map((item: any, index: number) => `
        <tr>
          <td><p style="text-align: center; margin-bottom: 10px;">${index + 1}</p></td>
          <td><p style="text-align: center; margin-bottom: 10px;">${item?.classification || ''}</p></td>
          ${item?.classification === 'Reliability' 
            ? `<td colspan="3" style="vertical-align: middle; text-align: center;"><p style="text-align: center; margin-bottom: 10px; font-weight: bold;">KR20 = ${(KR_20 || 0).toFixed(2)}</p></td>`
            : `
              <td class="question-no-cell"><p style="text-align: center; margin-bottom: 10px;">${formatQuestions(item?.questions || [])}</p></td>
              <td style="vertical-align: middle; text-align: center;"><p style="text-align: center; margin-bottom: 10px;">${(item?.questions || []).length}</p></td>
              <td style="vertical-align: middle; text-align: center;"><p style="text-align: center; margin-bottom: 10px;">${Number((Math.round(item?.perc || 0)).toFixed(1))}%</p></td>
            `
          }
          <td><p style="text-align: center; margin-bottom: 10px;">${getCommentByClassification(item?.classification || '')}</p></td>
        </tr>
      `).join("")}
    </table>

    <!-- Segregated Graded Students Table -->
    <table class="table  rounded-md overflow-hidden  border-collapse border border-black">
      <colgroup>
        <col style="width: auto;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
        <col style="width: 100px;">
      </colgroup>
      <tr>
        <th><p style="text-align: center; margin-bottom: 10px;">Students Number</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">A+</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">A</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">B+</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">B</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">C+</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">C</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">D+</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">D</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">F</p></th>
      </tr>
      <tr>
        <td><p style="text-align: center; margin-bottom: 10px;">${course?.studentsNumber || ''}</p></td>
       
        ${(segregatedGradedStudents || []).map((grade: any) => `
          <td class="split-cell">
            <div class="cell-row"><p style="text-align: center; margin-bottom: 10px;">${grade?.count === 0 ? '' : grade?.count}</p></div>
            <div class="cell-row"><p style="text-align: center; margin-bottom: 10px;">${ Number((Math.round(grade?.studentPercentage || 0)).toFixed(1)) === 0 ? "" : Number((Math.round(grade?.studentPercentage || 0)).toFixed(1)) + "%" }</p></div>
          </td>
        `).join("")}
      </tr>
    </table>
  </body>
  </html>`;
}