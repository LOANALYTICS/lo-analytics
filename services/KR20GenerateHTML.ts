export function generateHTML(data: any): string {
  const {
    groupedItemAnalysisResults = [],
    KR_20 = 0,
    segregatedGradedStudents = [],
    course = {},
    studentsAttended = 0,
    studentsPassed = 0,
    collegeInfo = {},
  } = data || {};

  // Interpret KR-20 Reliability score
  const getKR20Message = (kr20: number): string => {
    if (kr20 >= 0.9)
      return "• Excellent reliability; at the level of the best standardized tests.";
    if (kr20 >= 0.85)
      return "• Exam seems to be <u>Very Good</u> and reliable.";
    if (kr20 >= 0.8) return "• Exam seems to be Good and reliable.";
    if (kr20 >= 0.71)
      return "• Value lies between the <u>marginally acceptable ranges</u>. Items could be improved.";
    if (kr20 >= 0.61)
      return "• Somewhat low. Supplement with other measures for grading.";
    if (kr20 >= 0.51) return "• Revision needed. Supplement with more tests.";
    return "• Questionable reliability. Revision is needed.";
  };

  const getCommentByClassification = (classification: string): string => {
    if (classification === "Reliability") return getKR20Message(KR_20);

    switch (classification) {
      case "Poor (Bad) Questions":
        return "• Discrimination value of there items range is < 0.20. <br> • All the items should be either rejected or revised before re-use.";
      case "Very Difficult Questions":
        return "• Keys of these items are needed to be checked. <br> • Items should be rejected.";
      case "Difficult Questions":
        return "• Key of these items are needed to be checked. ";
      case "Good Questions":
        return "• Items could be stored in question Bank for further use.";
      case "Easy Questions":
        return "• Item should be revised before re-use.";
      case "Very Easy Questions":
        return "• Item should be either rejected or revised before re-use.";

      default:
        return "";
    }
  };

  const formatQuestions = (questions: any[]): string => {
    const questionNumbers = questions.map((q) => {
      const questionNum = q?.question || "";
      return questionNum.replace(/^Q/i, "");
    });

    const chunks: string[] = [];
    for (let i = 0; i < questionNumbers.length; i += 19) {
      chunks.push(questionNumbers.slice(i, i + 19).join(", "));
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
        padding: 1px;
        text-align: start;
        font-size: 23px;
      }
      .header-container {
        margin-bottom: 80px;
      }
      .header {
        width: 100%;
        text-align: center;
        padding: 4px;
        margin-bottom: 10px;
      }
      .header-description {
        max-width: fit-content;
        margin: 0 auto;
      }
    
  
      .college-logo {
        margin: 0 auto;
        height: 100%;
        min-width: 100%;
        min-height: 100%;
      }
      .college-name {
        font-size: 40px;
        font-weight: bold;
      }
      .university-name {
        font-size: 16px;
      }
      .table td p {
        font-size: 23px;
      }
      .table th p {
        font-size: 23px;
      }
      .comments-cell {
        max-width: 500px;
        white-space: normal;
        word-wrap: break-word;
        height: auto !important;
      }
      .comments-cell p {
        white-space: normal !important;
        word-wrap: break-word !important;
        text-align: center;
        margin-bottom: 10px;
        line-height: 1.4;
        height: auto !important;
      }
    </style>
  </head>
  <body>
    <!-- Header with Logo and College Information -->
    <div class="header-container">
      <div class="header">
        ${
          collegeInfo.logo
            ? `<img src="${collegeInfo.logo}" alt="College Logo" class="college-logo"/>`
            : ""
        }
       
      </div>
      <hr style="margin-bottom: 40px;"/>
      <div class="header-description">
        <h2 style="font-size: 30px; font-weight:700;">Item Analysis Report</h2>
       
      </div>
    </div>


    <!-- Course Details Section -->
    <div class="info-box  rounded-md overflow-hidden  border-collapse border border-black">
      <div class="course-grid">
        <div class="grid-item">
          <p><span style="font-weight: bold;">Course Name:</span> ${
            course?.course_name + " (" + course?.section.slice(0, 1).toUpperCase() + course?.section.slice(1) + ")" || ""
          }</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Course Code:</span> ${
            course?.course_code || ""
          }</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Credit Hour:</span> ${
            course?.credit_hours || ""
          }</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Level:</span> ${
            course?.level || ""
          }</p>
        </div>
        <div class="grid-item">
          <p><span style="font-weight: bold;">Semester:</span> ${
            course?.semister === 1 ? "First Semester" : "Second Semester" 
          } ${course?.academicYear ? "(" + course?.academicYear + ")" : ""}</p>
        </div>
      
        <div class="grid-item">
          <p><span style="font-weight: bold;">Course Coordinator:</span> ${
            course?.coordinator || ""
          }</p>
        </div>
      </div>
    </div>

    <table class="table  rounded-md overflow-hidden border-collapse border border-black">
      <tr>
        <th><p style="text-align: center; margin-bottom: 10px;">S.No</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Item Category</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Question No</p></th>
        <th><p style="text-align: center; margin-bottom: 10px; max-width: 120px;">Total </br> Questions</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">%</p></th>
        <th><p style="text-align: center; margin-bottom: 10px;">Comments/Recommendations</p></th>
      </tr>
      ${(groupedItemAnalysisResults || [])
        ?.map(
          (item: any, index: number) => `
        <tr>
          <td><p style="text-align: center; margin-bottom: 10px;${
            item?.classification === "Reliability" ? " font-weight: bold;" : ""
          }">${index + 1}</p></td>
          <td><p style="text-align: center; margin-bottom: 10px;${
            item?.classification === "Reliability" ? " font-weight: bold;" : ""
          }">${item?.classification || ""}</p></td>
          ${
            item?.classification === "Reliability"
              ? `<td colspan="3" style="vertical-align: middle; text-align: center; padding: 16px;"><p style="text-align: center; margin-bottom: 10px; font-weight: bold;">KR20 = ${(
                  KR_20 || 0
                ).toFixed(3)}</p></td>`
              : `
              <td class="question-no-cell"><p style="text-align: center; margin-bottom: 10px;">${formatQuestions(
                item?.questions || []
              )}</p></td>
              <td style="vertical-align: middle; text-align: center; max-width: 120px;"><p style="text-align: center; margin-bottom: 10px;">${
                (item?.questions || []).length < 1 ? "" : (item?.questions || []).length
              }</p></td>
              <td style="vertical-align: middle; text-align: center;"><p style="text-align: center; margin-bottom: 10px;">${
                Math.round(item?.perc || 0) === 0 ? "" : Math.round(item?.perc || 0) + "%"
              }</p></td>
            `
          }
          <td class="comments-cell">
            <p style="text-align: center; margin-bottom: 10px;${
              item?.classification === "Reliability"
                ? " font-weight: bold;"
                : ""
            }">${(item?.questions || []).length < 1 ? "" : getCommentByClassification(item?.classification || "")}</p>
          </td>
        </tr>
      `
        )
        .join("")}
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
        <th><p style="text-align: center; margin-bottom: 10px;">Students Attended</p></th>

        <th><p style="text-align: center; margin-bottom: 10px;">Students Passed</p></th>
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
        <td><p style="text-align: center; margin-bottom: 10px; font-size: 23px;">${
          studentsAttended || ""
        }</p></td>
       


        <td class="split-cell">
            <div class="cell-row"><p style="text-align: center; margin-bottom: 10px; font-size: 23px;">${
              studentsPassed || ""
            }</p></div>
            <div class="cell-row"><p style="text-align: center; margin-bottom: 10px; font-size: 23px;">${
              studentsPassed && studentsAttended
                ? ((studentsPassed / studentsAttended) * 100).toFixed(2) + "%"
                : ""
            }</p></div>
          </td>
       
        ${(segregatedGradedStudents || [])
          .map(
            (grade: any) => `
          <td class="split-cell">
            <div class="cell-row"><p style="text-align: center; margin-bottom: 10px; font-size: 23px;">${
              grade?.count === 0 ? "" : grade?.count
            }</p></div>
            <div class="cell-row"><p style="text-align: center; margin-bottom: 10px; font-size: 23px;">${
              Number(Math.round(grade?.studentPercentage || 0).toFixed(1)) === 0
                ? ""
                : Number(Math.round(grade?.studentPercentage || 0).toFixed(1)) +
                  "%"
            }</p></div>
          </td>
        `
          )
          .join("")}
      </tr>
    </table>
  </body>
  </html>`;
}
