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
      }
      .table th, .table td { 
        border: 1px solid #333; 
        padding: 8px 8px 8px 8px; 
        text-align: center;
        white-space: nowrap;
        height: 100%;
        vertical-align: middle !important;
        text-align: center !important;
        padding: 8px !important;
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
      .course-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;  /* Creates 2 equal columns */
        grid-template-rows: repeat(3, auto);  /* Creates 3 rows */
      }
      .grid-item {
        padding: 2px;
        // border: 1px solid #333;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <!-- Header with Logo and College Information -->
    <header>
      <img src="data:image/png;base64,${collegeInfo?.logo || ''}" alt="College Logo" class="logo" onerror="this.style.display='none'">
      <p>${collegeInfo?.english || ''} | ${collegeInfo?.regional || ''} | ${collegeInfo?.university || ''}</p>
    </header>

    <!-- Course Details Section -->
    <div class="info-box">
      <div class="course-grid">
        <div class="grid-item">
          <p>Course Name: ${course?.course_name || ''}</p>
        </div>
        <div class="grid-item">
          <p>Course Code: ${course?.course_code || ''}</p>
        </div>
        <div class="grid-item">
          <p>Credit Hour: ${course?.credit_hours || ''}</p>
        </div>
        <div class="grid-item">
          <p>Level: ${course?.level || ''}</p>
        </div>
        <div class="grid-item">
          <p>Semister: ${course?.semister || ''}</p>
        </div>
        <div class="grid-item">
          <p>Course Coordinator: ${course?.coordinator || ''}</p>
        </div>
      </div>
    </div>

    <!-- Item Analysis Table -->
    <table class="table">
      <tr>
        <th>S.No</th>
        <th>Item Category</th>
        <th>Question No</th>
        <th>Total Questions</th>
        <th>%</th>
        <th>Comments/Recommendations</th>
      </tr>
      ${(groupedItemAnalysisResults || [])?.map((item: any, index: number) => `
        <tr>
          <td><p style="margin-bottom: 10px;">${index + 1}</p></td>
          <td><p style="margin-bottom: 10px;">${item?.classification || ''}</p></td>
          ${item?.classification === 'Reliability' 
            ? `<td colspan="3" style="vertical-align: middle; text-align: center;"><p style="margin-bottom: 10px;">KR20 = ${(KR_20 || 0).toFixed(2)}</p></td>`
            : `
              <td class="question-no-cell"><p style="margin-bottom: 10px;">${formatQuestions(item?.questions || [])}</p></td>
              <td style="vertical-align: middle; text-align: center;"><p style="margin-bottom: 10px;">${(item?.questions || []).length}</p></td>
              <td style="vertical-align: middle; text-align: center;"><p style="margin-bottom: 10px;">${Number((item?.perc || 0).toFixed(1))}%</p></td>
            `
          }
          <td><p style="margin-bottom: 10px;">${getCommentByClassification(item?.classification || '')}</p></td>
        </tr>
      `).join("")}
    </table>

    <!-- Segregated Graded Students Table -->
    <table class="table">
      <tr>
        <th>Course Code</th>
        <th>Credit Hour</th>
        <th>Students Number</th>
        <th>Students Withdrawn</th>
        <th>Students Absent</th>
        <th>Students Attended</th>
        <th>Students Passed</th>
        <th>A+</th>
        <th>A</th>
        <th>B+</th>
        <th>B</th>
        <th>C+</th>
        <th>C</th>
        <th>D+</th>
        <th>D</th>
        <th>F</th>
      </tr>
      <tr>
        <td><p style="margin-bottom: 10px;">${course?.code || ''}</p></td>
        <td><p style="margin-bottom: 10px;">${course?.creditHours || ''}</p></td>
        <td><p style="margin-bottom: 10px;">${course?.studentsNumber || ''}</p></td>
        <td style="vertical-align: middle; text-align: center;"><p style="margin-bottom: 10px;">${course?.studentsWithdrawn || ''}</p></td>
        <td style="vertical-align: middle; text-align: center;"><p style="margin-bottom: 10px;">${course?.studentsAbsent || ''}</p></td>
        <td style="vertical-align: middle; text-align: center;"><p style="margin-bottom: 10px;">${course?.studentsAttended || ''}</p></td>
        <td class="split-cell" style="padding: 0;">
          <div class="cell-row">
            <p style="margin-bottom: 10px;">${course?.studentsPassed?.number || ''}</p>
          </div>
          <div class="cell-row">
            <p style="margin-bottom: 10px;">${course?.studentsPassed?.percentage || ''}%</p>
          </div>
        </td>
        ${(segregatedGradedStudents || []).map((grade: any) => `
          <td class="split-cell">
            <div class="cell-row"><p style="margin-bottom: 10px;">${grade?.count || '0'}</p></div>
            <div class="cell-row"><p style="margin-bottom: 10px;">${grade?.studentPercentage || ''}%</p></div>
          </td>
        `).join("")}
      </tr>
    </table>
  </body>
  </html>`;
}