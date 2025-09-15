export interface PloGroupItem {
  cloNumber: string;
  cloText: string;
  mappedPLOs: string[];
  weightage: number | null;
  direct: { achievementGrade: string; percentageAchieving: string };
  indirect: { achievementGrade: string; percentageAchieving: string };
}

export interface PloGroups {
  knowledge: PloGroupItem[];
  skills: PloGroupItem[];
  values: PloGroupItem[];
}

export interface PloGroupReportProps {
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
  plogroups: PloGroups;
  benchmark: number; // Direct targeted level to display (e.g., 60/70/80/90)
  comments?: {
    strengthPoints: string[];
    weaknessPoints: string[];
    recommendations: string[];
  };
}

function escapeHTML(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtPct(input: unknown): string {
  const n = Number(input);
  if (Number.isFinite(n)) return `${n.toFixed(1)}%`;
  return "-";
}

function diffComment(actual: number | null, target: number): string {
  if (actual === null || !Number.isFinite(actual)) return "-";
  const delta = actual - target;
  const mag = Math.abs(delta).toFixed(1);
  if (delta > 0) return `The actual Level of CLOs is greater than Target Level by ${mag} %`;
  if (delta < 0) return `The actual Level of CLOs is less than Target Level by ${mag} %`;
  return "The actual Level equals the Target Level";
}

function buildGroupSection(title: string, items: PloGroupItem[], directTarget: number, groupNumber: number): string {
  const indirectTarget = 80; // Indirect targeted level is constant 80%

  const rows: string[] = [];

  items.forEach((item, index) => {
    const directActualNum = Number(item?.direct?.percentageAchieving);
    const indirectActualNum = Number(item?.indirect?.percentageAchieving);
    const directActual = Number.isFinite(directActualNum) ? directActualNum : null;
    const indirectActual = Number.isFinite(indirectActualNum) ? indirectActualNum : null;

    const serial = `${groupNumber}.${index + 1}`; // e.g., 1.1, 1.2 for group 1, 2.1, 2.2 for group 2

    rows.push(`
      <tr class="clo-row clo-row-direct row-${escapeHTML(serial)}">
        <td rowspan="2" class="sno">${escapeHTML(serial)}</td>
        <td rowspan="2" class="clo-text">${escapeHTML(item.cloText)}</td>
        <td rowspan="2" class="weight">${item.weightage !== null ? escapeHTML(String(item.weightage)) : '-'}</td>
        <td rowspan="2" class="plos">${escapeHTML(item.mappedPLOs?.join(' ') || '-')}</td>
        <td class="method">Direct</td>
        <td class="target">≥ ${directTarget}% of students achieve ≥ 60% of CLOs</td>
        <td class="actual">${fmtPct(directActual)} of students achieve ≥ 60 % of CLOs</td>
        <td class="comment">${escapeHTML(diffComment(directActual, directTarget))}</td>
      </tr>
      <tr class="clo-row clo-row-indirect row-${escapeHTML(serial)}">
        <td class="method">Indirect</td>
        <td class="target">≥ ${indirectTarget}% of students should agree that they achieved the CLO</td>
        <td class="actual">${fmtPct(indirectActual)} of students agreed that they achieved the CLO</td>
        <td class="comment">${escapeHTML(diffComment(indirectActual, indirectTarget))}</td>
      </tr>
    `);
  });

  return `
    <tbody class="group-block">
      <tr class="group-header"><td colspan="8"><span class="group-index"></span> ${escapeHTML(title)}:</td></tr>
      ${rows.join('\n')}
    </tbody>
  `;
}

function generateCommentsAndSignaturePage(comments?: { strengthPoints: string[]; weaknessPoints: string[]; recommendations: string[] }): string {
  if (!comments) {
    return `
      <div class="comments-page">
        <div class="comments-content">
          <h3>AI Analysis Comments</h3>
          <p class="error-message">Error with AI analysis - comments not available</p>
        </div>
        <div class="signatures-bottom">
          <div class="signature-row">
            <div class="signature-item">
              <div class="signature-label">Course Coordinator</div>
              <div class="signature-line"></div>
              <div class="signature-name">Dr.</div>
            </div>
            <div class="signature-item">
              <div class="signature-label">Quality Coordinator</div>
              <div class="signature-line"></div>
              <div class="signature-name">Dr.</div>
            </div>
            <div class="signature-item">
              <div class="signature-label">Head of the Department</div>
              <div class="signature-line"></div>
              <div class="signature-name">Dr.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const strengthPointsHtml = comments.strengthPoints?.map(point => `<li>• ${escapeHTML(point)}</li>`).join('') || '';
  const weaknessPointsHtml = comments.weaknessPoints?.map(point => `<li>• ${escapeHTML(point)}</li>`).join('') || '';
  const recommendationsHtml = comments.recommendations?.map(rec => `<li>• ${escapeHTML(rec)}</li>`).join('') || '';

  return `
    <div class="comments-page">
      <div class="comments-content">
        <h3>AI Analysis Comments</h3>
        ${strengthPointsHtml ? `
          <div class="comment-category">
            <h4>Strengths:</h4>
            <ul>${strengthPointsHtml}</ul>
          </div>
        ` : ''}
        ${weaknessPointsHtml ? `
          <div class="comment-category">
            <h4>Weaknesses:</h4>
            <ul>${weaknessPointsHtml}</ul>
          </div>
        ` : ''}
        ${recommendationsHtml ? `
          <div class="comment-category">
            <h4>Recommendations:</h4>
            <ul>${recommendationsHtml}</ul>
          </div>
        ` : ''}
        <p>Note: Based on NCAA Guidelines</p>
      </div>
      <div class="signatures-bottom">
        <div class="signature-row">
          <div class="signature-item">
            <div class="signature-label">Course Coordinator</div>
            <div class="signature-line"></div>
            <div class="signature-name">Dr.</div>
          </div>
          <div class="signature-item">
            <div class="signature-label">Quality Coordinator</div>
            <div class="signature-line"></div>
            <div class="signature-name">Dr.</div>
          </div>
          <div class="signature-item">
            <div class="signature-label">Head of the Department</div>
            <div class="signature-line"></div>
            <div class="signature-name">Dr.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function generatePloGroupReportHTML(props: PloGroupReportProps): Promise<string> {
  const { course, college, plogroups, benchmark, comments } = props;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 100%; margin: 0 auto; padding: 20px; }

          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: 8px; font-size: 16px; text-align: center; }
          th.clo-text, td.clo-text { text-align: left; width: 200px; min-width: 200px; max-width: 200px; }
          thead th { background: #4b2e83; color: #fff; font-weight: 700; font-size: 16px; }
          thead .subhead th { background: #5e3a9f; color: #fff; font-size: 16px; }
          .group-header td { background: #e0f3ff; font-weight: 700; text-align: left; font-size: 16px; }

          /* Improved pagination - ensure rows don't break across pages */
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          tbody.group-block { page-break-inside: avoid !important; break-inside: avoid !important; }
          .clo-row { page-break-inside: avoid !important; break-inside: avoid !important; }
          
          /* Adjust column widths to fit PDF page - optimized for printing */
          th.sno, td.sno { width: 50px; min-width: 50px; max-width: 50px; }
          th.weight, td.weight { width: 80px; min-width: 80px; max-width: 80px; }
          th.plos, td.plos { width: 60px; min-width: 60px; max-width: 60px; }
          th.method, td.method { width: 70px; min-width: 70px; max-width: 70px; }
          th.assessment-results { width: 160px; min-width: 160px; max-width: 160px; }
          th.target, td.target, th.actual, td.actual { width: 80px; min-width: 80px; max-width: 80px; }
          .comment { word-wrap: break-word;width: 80px; min-width: 80px; max-width: 80px; }
          
          /* Comments and Signature Page Styles */
          .comments-page {
            page-break-before: always !important;
            break-before: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100%;
            height: 1380px;
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
          }
          
          .comments-content {
            flex: 0 0 auto;
          }
          
          .comments-content h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #4b2e83;
            text-align: left;
          }
          
          .comment-category {
            margin-bottom: 20px;
          }
          
          .comment-category h4 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
          }
          
          .comment-category ul {
            margin: 0;
            padding-left: 20px;
          }
          
          .comment-category li {
            font-size: 14px;
            margin-bottom: 5px;
            line-height: 1.4;
          }
          
          .error-message {
            color: #d32f2f;
            font-style: italic;
            font-size: 14px;
          }
          
          .signatures-bottom {
            flex: 1 1 auto;
            display: flex;
            align-items: flex-end;
            padding-bottom: 50px;
          }
          
          .signature-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
          }
          
          .signature-item {
            text-align: center;
            flex: 1;
            margin: 0 10px;
          }
          
          .signature-label {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            height: 1px;
            margin: 20px 0 5px 0;
            min-height: 30px;
          }
          
          .signature-name {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Add page break control */
          @media print {
            .group-block { page-break-before: auto; }
            tr { page-break-inside: avoid !important; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            /* Ensure consistent font sizes across all pages */
            th, td { font-size: 16px !important; }
            thead th { font-size: 16px !important; }
            .group-header td { font-size: 16px !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <table>
            <thead>
              <tr>
                <th rowspan="2" class="sno">S.No</th>
                <th rowspan="2" class="clo-text">Course Learning Outcomes (CLOs)</th>
                <th rowspan="2" class="weight">Weightage of each CLO</th>
                <th rowspan="2" class="plos">Related PLOs Code</th>
                <th rowspan="2" class="method">Assessment Methods</th>
                <th colspan="2" class="assessment-results">Assessment Results</th>
                <th rowspan="2" class="comment">Comment on Assessment Results</th>
              </tr>
              <tr class="subhead">
                <th class="target">Targeted Level</th>
                <th class="actual">Actual Level</th>
              </tr>

            </thead>

            ${buildGroupSection('1.Knowledge and Understanding', plogroups.knowledge || [], benchmark, 1)}
            ${buildGroupSection('2.Skills', plogroups.skills || [], benchmark, 2)}
            ${buildGroupSection('3.Values', plogroups.values || [], benchmark, 3)}
          </table>
          
          <!-- Comments removed - handled separately -->
        </div>
      </body>
    </html>
  `;
}

export async function generateCommentsReportHTML(comments: { strengthPoints: string[]; weaknessPoints: string[]; recommendations: string[] }): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 100%; margin: 0 auto; padding: 20px; }
          
          /* Comments and Signature Page Styles */
          .comments-page {
            page-break-before: always !important;
            break-before: always !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            width: 100%;
            height: 1380px;
            display: flex;
            flex-direction: column;
            padding: 20px;
            box-sizing: border-box;
          }
          
          .comments-content {
            flex: 0 0 auto;
          }
          
          .comments-content h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #4b2e83;
            text-align: left;
          }
          
          .comment-category {
            margin-bottom: 20px;
          }
          
          .comment-category h4 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
          }
          
          .comment-category ul {
            margin: 0;
            padding-left: 20px;
          }
          
          .comment-category li {
            font-size: 14px;
            margin-bottom: 5px;
            line-height: 1.4;
          }
          
          .error-message {
            color: #d32f2f;
            font-style: italic;
            font-size: 14px;
          }
          
          .signatures-bottom {
            flex: 1 1 auto;
            display: flex;
            align-items: flex-end;
            padding-bottom: 50px;
          }
          
          .signature-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
          }
          
          .signature-item {
            text-align: center;
            flex: 1;
            margin: 0 10px;
          }
          
          .signature-label {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            height: 1px;
            margin: 20px 0 5px 0;
            min-height: 30px;
          }
          
          .signature-name {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${generateCommentsAndSignaturePage(comments)}
        </div>
      </body>
    </html>
  `;
}


