import { Course } from "@/lib/models";
import { Types } from "mongoose";
import { formatKRAverage, formatNumber } from "../utils/format.utils";
import { convertNumberToWord } from "@/lib/utils/number-to-word";

interface CourseCompareParams {
  collegeId: string;
  semister: number;
  yearA: string;
  yearB: string;
  sectionA: string;
  sectionB: string;
}

function calculateAverages(courses: any[]) {
  const totals = {
    accepted: courses.reduce(
      (sum, course) => sum + (course.yearA?.accepted || 0),
      0
    ),
    rejected: courses.reduce(
      (sum, course) => sum + (course.yearA?.rejected || 0),
      0
    ),
    acceptedB: courses.reduce(
      (sum, course) => sum + (course.yearB?.accepted || 0),
      0
    ),
    rejectedB: courses.reduce(
      (sum, course) => sum + (course.yearB?.rejected || 0),
      0
    ),
    kr20A: courses.reduce((sum, course) => {
      const kr20 = course.yearA?.kr20 ? Number(course.yearA.kr20) : 0;
      return sum + kr20;
    }, 0),
    kr20B: courses.reduce((sum, course) => {
      const kr20 = course.yearB?.kr20 ? Number(course.yearB.kr20) : 0;
      return sum + kr20;
    }, 0),
  };

  const count = courses.length || 1;
  const totalA = totals.accepted + totals.rejected;
  const totalB = totals.acceptedB + totals.rejectedB;

  const rawAverages = {
    accepted: totals.accepted / count,
    rejected: totals.rejected / count,
    acceptedB: totals.acceptedB / count,
    rejectedB: totals.rejectedB / count,
    kr20A: totals.kr20A / count,
    kr20B: totals.kr20B / count,
  };

  return {
    accepted: rawAverages.accepted.toFixed(1),
    rejected: rawAverages.rejected.toFixed(1),
    acceptedB: rawAverages.acceptedB.toFixed(1),
    rejectedB: rawAverages.rejectedB.toFixed(1),
    acceptedPercentageA: totalA
      ? Math.round((totals.accepted / totalA) * 100)
      : "",
    rejectedPercentageA: totalA
      ? Math.round((totals.rejected / totalA) * 100)
      : "",
    acceptedPercentageB: totalB
      ? Math.round((totals.acceptedB / totalB) * 100)
      : "",
    rejectedPercentageB: totalB
      ? Math.round((totals.rejectedB / totalB) * 100)
      : "",
    kr20A: totals.kr20A ? (totals.kr20A / count).toFixed(2) : "-",
    kr20B: totals.kr20B ? (totals.kr20B / count).toFixed(2) : "-",
    raw: rawAverages,
  };
}

function generateTableHTML(
  title: string,
  courses: any[],
  yearA: string,
  yearB: string,
  sectionA: string,
  sectionB: string,
  isLevel: boolean = true
) {
  const averages = calculateAverages(courses);

  return `
    <div class="table-container" style="margin-bottom: 20px;">
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: 200px;">
          <col span="6" style="width: auto;">
        </colgroup>
        <thead>
          <tr>
            <th colspan="2" style="border-color: #000000 !important; width: 300px !important; background-color: #f0f0f0;" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 14px;">${isLevel ? ` ${title}` : `DEPARTMENT: ${title}`
    }</p>
            </th>
            <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 14px;"> ${sectionA?.charAt(0).toUpperCase() +
    sectionA?.slice(1).toLowerCase()
    }, ${yearA}</p>
            </th>
            <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 14px;"> ${sectionB?.charAt(0).toUpperCase() +
    sectionB?.slice(1).toLowerCase()
    }, ${yearB}</p>
            </th>
          </tr>
          <tr>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">N</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px; font-size: 12px;">Course Title & Code</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">Accepted</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">Rejected</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">KR20</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">Accepted</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">Rejected</p></th>
            <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">KR20</p></th>
          </tr>
        </thead>
        <tbody>
          ${courses
      .map(
        (course, index) => `
            <tbody class="row-pair">
              <tr>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${index + 1
          }</p></td>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.courseTitle
          }</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${formatNumber(
            course.yearA?.accepted
          )}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${formatNumber(
            course.yearA?.rejected
          )}</p></td>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold">${course.yearA?.kr20 ? Number(course.yearA.kr20).toFixed(2) : "-"
          }</p>
                </td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${formatNumber(
            course.yearB?.accepted
          )}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${formatNumber(
            course.yearB?.rejected
          )}</p></td>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold">${course.yearB?.kr20 ? Number(course.yearB.kr20).toFixed(2) : "-"
          }</p>
                </td>
              </tr>
              <tr>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">
                    ${course.yearA?.acceptedPercentage
            ? Math.round(course.yearA.acceptedPercentage) + "%"
            : ""
          }
                  </p>
                </td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">
                    ${course.yearA?.rejectedPercentage
            ? Math.round(course.yearA.rejectedPercentage) + "%"
            : ""
          }
                  </p>
                </td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">
                    ${course.yearB?.acceptedPercentage
            ? Math.round(course.yearB.acceptedPercentage) + "%"
            : ""
          }
                  </p>
                </td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">
                    ${course.yearB?.rejectedPercentage
            ? Math.round(course.yearB.rejectedPercentage) + "%"
            : ""
          }
                  </p>
                </td>
              </tr>
            </tbody>
          `
      )
      .join("")}
          <tr>
            <td rowspan="2" colspan="2"   style="border-color: #000000 !important;" class="border border-black p-1">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;font-weight: bold;">Average</p>
            </td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;font-weight: bold;">${averages.accepted}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;font-weight: bold;">${averages.rejected}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">${averages.kr20A}</p>
            </td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">${averages.acceptedB}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">${averages.rejectedB}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">${averages.kr20B}</p>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">
                ${averages.acceptedPercentageA
      ? averages.acceptedPercentageA + "%"
      : ""
    }
              </p>
            </td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">
                ${averages.rejectedPercentageA
      ? averages.rejectedPercentageA + "%"
      : ""
    }
              </p>
            </td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">
                ${averages.acceptedPercentageB
      ? averages.acceptedPercentageB + "%"
      : ""
    }
              </p>
            </td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px; font-weight: bold;">
                ${averages.rejectedPercentageB
      ? averages.rejectedPercentageB + "%"
      : ""
    }
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <style>
        .table-container {
          width: 100%;
          margin-bottom: 20px;
        }
        
        .data-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 8pt;
        }
        
        .data-table th,
        .data-table td {
          border: 1px solid #e5e7eb;
          padding: 4px;
          text-align: center;
          vertical-align: middle;
        }
        
        .data-table th {
          background-color: #f8fafc;
        }
        
        .data-table tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        .data-table tbody tr {
          page-break-inside: auto;
        }
        
        .data-table thead {
          display: table-header-group;
        }
        
        .data-table tbody {
          display: table-row-group;
        }
        
        .data-table p {
          margin: 0;
          padding: 0;
          line-height: 1.2;
        }

        @page {
          margin: 0.5in 0.3in;
        }

        @media print {
          .table-container {
            page-break-inside: auto !important;
          }
          
          .data-table {
            page-break-inside: auto !important;
          }
          
          .data-table tr {
            page-break-inside: avoid !important;
          }
          
          .data-table thead {
            display: table-header-group !important;
          }
          
          .data-table tbody {
            display: table-row-group !important;
          }
          
          .data-table th,
          .data-table td {
            page-break-inside: avoid !important;
          }
        }
      </style>
    </div>
  `;
}

function generateSummaryTableHTML(
  title: string,
  summaries: any[],
  isLevel: boolean = true,
  yearA: string,
  yearB: string,
  sectionA: string,
  sectionB: string,
  mt: number = 4
) {
  const totalAcceptedA = summaries.reduce(
    (acc, curr) => acc + (Number(curr.averages.acceptedPercentageA) || 0),
    0
  );
  const totalRejectedA = summaries.reduce(
    (acc, curr) => acc + (Number(curr.averages.rejectedPercentageA) || 0),
    0
  );
  const totalAcceptedB = summaries.reduce(
    (acc, curr) => acc + (Number(curr.averages.acceptedPercentageB) || 0),
    0
  );
  const totalRejectedB = summaries.reduce(
    (acc, curr) => acc + (Number(curr.averages.rejectedPercentageB) || 0),
    0
  );

  const avgAcceptedPercentageA =
    !isNaN(totalAcceptedA) && summaries.length > 0
      ? Math.round(totalAcceptedA / summaries.length)
      : "";
  const avgRejectedPercentageA =
    !isNaN(totalRejectedA) && summaries.length > 0
      ? Math.round(totalRejectedA / summaries.length)
      : "";
  const avgAcceptedPercentageB =
    !isNaN(totalAcceptedB) && summaries.length > 0
      ? Math.round(totalAcceptedB / summaries.length)
      : "";
  const avgRejectedPercentageB =
    !isNaN(totalRejectedB) && summaries.length > 0
      ? Math.round(totalRejectedB / summaries.length)
      : "";

  return `
    <table class="table-container mt-${mt} min-w-full border-collapse border  rounded-md overflow-hidden border-black" style="border-color: #000000 !important;">
      <colgroup>
        <col style="width: 40px;">
        <col style="width: 200px;">
        <col span="6" style="width: auto;">
      </colgroup>
      <thead class="row-pair">
        <tr>
          <th colspan="2" style="width: 300px !important; background-color: #f0f0f0;" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${title}</p>
          </th>
          <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;"> ${sectionA?.charAt(0).toUpperCase() +
    sectionA?.slice(1).toLowerCase()
    }, ${yearA}</p>
          </th>
          <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;"> ${sectionB?.charAt(0).toUpperCase() +
    sectionB?.slice(1).toLowerCase()
    }, ${yearB}</p>
          </th>
        </tr>
        <tr>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">N</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel ? "Level" : "Department"
    }</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
        </tr>
      </thead>
      <tbody class="row-pair">
        ${summaries
      .map(
        (summary, index) => `
          <tr>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1
          }</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${summary.name
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.accepted === 0 ? "-" : summary.averages.accepted || "-"
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejected === 0 ? "-" : summary.averages.rejected || "-"
          }</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold">${summary.averages.kr20A || "-"
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.acceptedB === 0 ? "-" : summary.averages.acceptedB || "-"
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejectedB === 0 ? "-" : summary.averages.rejectedB || "-"
          }</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold">${summary.averages.kr20B || "-"
          }</p></td>
          </tr>
          <tr>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.acceptedPercentageA || "-"
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejectedPercentageA || "-"
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.acceptedPercentageB || "-"
          }</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejectedPercentageB || "-"
          }</p></td>
          </tr>
        `
      )
      .join("")}
        <tr>
          <td rowspan="2" colspan="2" style="border-color: #000000 !important;" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">Average</p></td>
          <td style="border-color: #000000 !important;" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${(
        summaries.reduce((acc, curr) => acc + curr.averages.raw.accepted, 0) /
        summaries.length
      ).toFixed(1)}</p></td>
          <td style="border-color: #000000 !important;" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${(
        summaries.reduce((acc, curr) => acc + curr.averages.raw.rejected, 0) /
        summaries.length
      ).toFixed(1)}</p></td>
          <td rowspan="2" style="border-color: #000000 !important;" class=" border border-black p-1 font-bold">
  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">
    ${(
      summaries.reduce((acc, curr) => {
        const kr20 = curr.averages.raw.kr20A || 0;
        return acc + kr20;
      }, 0) / (summaries.length || 1)
    ).toFixed(2)}
  </p>
</td>
          <td style="border-color: #000000 !important;" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${(
      summaries.reduce((acc, curr) => acc + curr.averages.raw.acceptedB, 0) /
      summaries.length
    ).toFixed(1)}</p></td>
          <td style="border-color: #000000 !important;" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${(
      summaries.reduce((acc, curr) => acc + curr.averages.raw.rejectedB, 0) /
      summaries.length
    ).toFixed(1)}</p></td>
          <td rowspan="2" style="border-color: #000000 !important;" class="border border-black p-1 font-bold">
  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">
    ${(
      summaries.reduce((acc, curr) => {
        const kr20 = curr.averages.raw.kr20B || 0;
        return acc + kr20;
      }, 0) / (summaries.length || 1)
    ).toFixed(2)}
  </p>
</td>
        </tr>
        <tr>
          <td class="border border-black p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${avgAcceptedPercentageA}${avgAcceptedPercentageA ? "%" : ""
    }</p>
          </td>
          <td class="border border-black p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${avgRejectedPercentageA}${avgRejectedPercentageA ? "%" : ""
    }</p>
          </td>
          <td class="border border-black p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${avgAcceptedPercentageB}${avgAcceptedPercentageB ? "%" : ""
    }</p>
          </td>
          <td class="border border-black p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${avgRejectedPercentageB}${avgRejectedPercentageB ? "%" : ""
    }</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function processCoursesForComparison(
  courses: any[],
  sectionA: string,
  sectionB: string,
  yearA: string,
  yearB: string
) {
  const groupedByLevel: { [key: number]: any[] } = {};
  const groupedByDepartment: { [key: string]: any[] } = {};

  courses.forEach((course) => {
    const level = course.level;
    const department = course.department || "Uncategorized";

    if (!groupedByLevel[level]) groupedByLevel[level] = [];
    if (!groupedByDepartment[department]) groupedByDepartment[department] = [];

    const krValue = course.krValues;

    let accepted = 0;
    let rejected = 0;

    krValue?.groupedItemAnalysisResults?.forEach((group: any) => {
      const questionCount = group.questions?.length || 0;

      if (
        ["Good Questions", "Easy Questions", "Very Easy Questions"].includes(
          group.classification
        )
      ) {
        accepted += questionCount;
      } else if (
        [
          "Poor (Bad) Questions",
          "Very Difficult Questions",
          "Difficult Questions",
        ].includes(group.classification)
      ) {
        rejected += questionCount;
      }
    });

    const total = accepted + rejected;

    const courseData: any = {
      courseTitle: `${course.course_name} (${course.course_code})`,
      courseCode: course.course_code,
      level: course.level,
      department: course.department,
      yearA: {},
      yearB: {},
    };

    if (course.section === sectionA && course.academic_year === yearA) {
      courseData.yearA = {
        accepted,
        rejected,
        kr20: krValue?.KR_20 || 0,
        acceptedPercentage: total ? (accepted / total) * 100 : 0,
        rejectedPercentage: total ? (rejected / total) * 100 : 0,
      };

      if (sectionA === sectionB && yearA === yearB) {
        courseData.yearB = { ...courseData.yearA };
      }
    } else if (course.section === sectionB && course.academic_year === yearB) {
      courseData.yearB = {
        accepted,
        rejected,
        kr20: krValue?.KR_20 || 0,
        acceptedPercentage: total ? (accepted / total) * 100 : 0,
        rejectedPercentage: total ? (rejected / total) * 100 : 0,
      };
    }

    const existingLevelCourse = groupedByLevel[level].find(
      (c) => c.courseCode === course.course_code
    );
    if (existingLevelCourse) {
      if (courseData.yearA && Object.keys(courseData.yearA).length > 0) {
        existingLevelCourse.yearA = courseData.yearA;
      }
      if (courseData.yearB && Object.keys(courseData.yearB).length > 0) {
        existingLevelCourse.yearB = courseData.yearB;
      }
    } else {
      groupedByLevel[level].push(courseData);
    }

    const existingDeptCourse = groupedByDepartment[department].find(
      (c) => c.courseCode === course.course_code
    );
    if (existingDeptCourse) {
      if (courseData.yearA && Object.keys(courseData.yearA).length > 0) {
        existingDeptCourse.yearA = courseData.yearA;
      }
      if (courseData.yearB && Object.keys(courseData.yearB).length > 0) {
        existingDeptCourse.yearB = courseData.yearB;
      }
    } else {
      groupedByDepartment[department].push(courseData);
    }
  });

  return { groupedByLevel, groupedByDepartment };
}

export async function compareCourses({
  collegeId,
  semister,
  yearA,
  yearB,
  sectionA,
  sectionB,
}: CourseCompareParams) {
  const collegeObjectId = new Types.ObjectId(collegeId);

  const courses = await Course.find({
    collage: collegeObjectId,
    semister: semister,
    section: { $in: [sectionA, sectionB] },
    academic_year: { $in: [yearA, yearB] },
  })
    .populate("krValues")
    .lean();

  const { groupedByLevel, groupedByDepartment } = processCoursesForComparison(
    courses,
    sectionA,
    sectionB,
    yearA,
    yearB
  );

  // Generate individual tables for each level
  const levelTables = Object.entries(groupedByLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, courses]) =>
      generateTableHTML(
        `Level ${level} - ${convertNumberToWord(semister)} Semester`,
        courses,
        yearA,
        yearB,
        sectionA,
        sectionB,
        true
      )
    );

  // Generate individual tables for each department
  const departmentTables = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) =>
      generateTableHTML(
        `${dept} - ${convertNumberToWord(semister)} Semester`,
        courses,
        yearA,
        yearB,
        sectionA,
        sectionB,
        false
      )
    );

  // Generate ONE summary table for all levels
  const levelSummaryTable = generateSummaryTableHTML(
    `Level Summary - ${convertNumberToWord(semister)} Semester`,
    Object.entries(groupedByLevel)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, courses]) => ({
        name: `Level ${level}`,
        averages: calculateAverages(courses),
      })),
    true,
    yearA,
    yearB,
    sectionA,
    sectionB,
    5
  );

  // Generate ONE summary table for all departments
  const departmentSummaryTable = generateSummaryTableHTML(
    `Department Summary - ${convertNumberToWord(semister)} Semester`,
    Object.entries(groupedByDepartment)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dept, courses]) => ({
        name: dept,
        averages: calculateAverages(courses),
      })),
    false,
    yearA,
    yearB,
    sectionA,
    sectionB,
    5
  );

  return {
    tables: [
      ...levelTables,
      ...departmentTables,
      levelSummaryTable,
      departmentSummaryTable,
    ],
    styles: `
      <style>
        .table-wrapper {
          page-break-inside: avoid !important;
          display: block !important;
          position: relative !important;
          break-inside: avoid !important;
        }
        
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
          font-size: 12px !important;
        }
        
        table:last-child {
          margin-bottom: 0 !important;
        }

        tr td:first-child {
          width: 60px !important;
          max-width: 60px !important;
        }

        tr td:nth-child(2) {
          width: 240px !important;
          max-width: 240px !important;
          text-align: left !important;
          white-space: normal !important;
        }

        th[colspan="2"] {
          background-color: #24b1db !important;
          text-align: left !important;
          width: 300px !important;
        }
        
        th[colspan="3"] {
          background-color: #f8f9fa !important;
        }
    

        td:nth-child(n+3) {
          width: 80px !important;
          text-align: center !important;
        }

        tr:last-child td,
        tr:nth-last-child(2) td {
          // font-weight: bold !important;
          background-color: #f8f9fa !important;
        }

        @media print {
          div {
            break-inside: avoid !important;
          }
          
          .table-wrapper {
            margin: 15px 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      </style>
    `,
  };
}
