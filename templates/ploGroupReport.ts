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

function buildGroupSection(title: string, items: PloGroupItem[], directTarget: number): string {
  const indirectTarget = 80; // Indirect targeted level is constant 80%

  const rows: string[] = [];

  items.forEach((item, index) => {
    const directActualNum = Number(item?.direct?.percentageAchieving);
    const indirectActualNum = Number(item?.indirect?.percentageAchieving);
    const directActual = Number.isFinite(directActualNum) ? directActualNum : null;
    const indirectActual = Number.isFinite(indirectActualNum) ? indirectActualNum : null;

    const serial = `${(index + 1).toFixed(1)}`; // e.g., 1.1, 1.2 per group

    rows.push(`
      <tr class="clo-row clo-row-direct row-${escapeHTML(serial)}">
        <td rowspan="2" class="sno">${escapeHTML(serial)}</td>
        <td rowspan="2" class="clo-text">${escapeHTML(item.cloText)}</td>
        <td rowspan="2" class="weight">${item.weightage !== null ? escapeHTML(String(item.weightage)) : '-'}</td>
        <td rowspan="2" class="plos">${escapeHTML(item.mappedPLOs?.join(' ') || '-')}</td>
        <td class="method">Direct</td>
        <td class="target">≥ ${directTarget}% of students achieve ≥ 60% of CLOs</td>
        <td class="actual">${fmtPct(directActual)}</td>
        <td class="comment">${escapeHTML(diffComment(directActual, directTarget))}</td>
      </tr>
      <tr class="clo-row clo-row-indirect row-${escapeHTML(serial)}">
        <td class="method">Indirect</td>
        <td class="target">≥ ${indirectTarget}% of students should agree that they achieved the CLO</td>
        <td class="actual">${fmtPct(indirectActual)}</td>
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

export async function generatePloGroupReportHTML(props: PloGroupReportProps): Promise<string> {
  const { course, college, plogroups, benchmark } = props;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 100%; margin: 0 auto; padding: 20px; }

          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: 8px; font-size: 14px; text-align: center; }
          th.clo-text, td.clo-text { text-align: left; width: 280px; min-width: 280px; max-width: 280px; }
          thead th { background: #4b2e83; color: #fff; font-weight: 700; font-size: 15px; }
          thead .subhead th { background: #5e3a9f; color: #fff; }
          .group-header td { background: #e0f3ff; font-weight: 700; text-align: left; font-size: 15px; }

          /* Improved pagination - ensure rows don't break across pages */
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          tbody.group-block { page-break-inside: avoid !important; break-inside: avoid !important; }
          .clo-row { page-break-inside: avoid !important; break-inside: avoid !important; }
          
          /* Adjust column widths to make table bigger - match header and row cells */
          th.sno, td.sno { width: 60px; min-width: 60px; max-width: 60px; }
          th.weight, td.weight { width: 110px; min-width: 110px; max-width: 110px; }
          th.plos, td.plos { width: 80px; min-width: 80px; max-width: 80px; }
          th.method, td.method { width: 80px; min-width: 80px; max-width: 80px; }
          th.assessment-results { width: 180px; min-width: 180px; max-width: 180px; }
          th.target, td.target, th.actual, td.actual { width: 90px; min-width: 90px; max-width: 90px; }
          .comment { word-wrap: break-word;width: 100px; min-width: 100px; max-width: 100px; }
          
          /* Add page break control */
          @media print {
            .group-block { page-break-before: auto; }
            tr { page-break-inside: avoid !important; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
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

            ${buildGroupSection('Knowledge and Understanding', plogroups.knowledge || [], benchmark)}
            ${buildGroupSection('Skills', plogroups.skills || [], benchmark)}
            ${buildGroupSection('Values', plogroups.values || [], benchmark)}
          </table>
        </div>
      </body>
    </html>
  `;
}


