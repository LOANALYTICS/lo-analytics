import { Types } from "mongoose";
import { Course } from "@/lib/models";
import { convertNumberToWord } from "@/lib/utils/number-to-word";
import { formatKRAverage, formatNumber } from "../utils/format.utils";

interface YearCompareParams {
  collegeId: string;
  semisterA: number;
  semisterB: number;
  yearA: string;
  yearB: string;
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
    kr20A: courses.reduce((sum, course) => sum + (course.yearA?.kr20 || 0), 0),
    kr20B: courses.reduce((sum, course) => sum + (course.yearB?.kr20 || 0), 0),
  };

  const count = courses.length || 1;
  const totalA = totals.accepted + totals.rejected;
  const totalB = totals.acceptedB + totals.rejectedB;

  const kr20ValueA = totals.kr20A / count;
  const kr20ValueB = totals.kr20B / count;

  return {
    accepted: Math.round(totals.accepted / count),
    rejected: Math.round(totals.rejected / count),
    acceptedB: Math.round(totals.acceptedB / count),
    rejectedB: Math.round(totals.rejectedB / count),
    acceptedPercentageA: totalA
      ? Math.round((totals.accepted / totalA) * 100)
      : "0",
    rejectedPercentageA: totalA
      ? Math.round((totals.rejected / totalA) * 100)
      : "0",
    acceptedPercentageB: totalB
      ? Math.round((totals.acceptedB / totalB) * 100)
      : "0",
    rejectedPercentageB: totalB
      ? Math.round((totals.rejectedB / totalB) * 100)
      : "0",
    kr20A: kr20ValueA.toFixed(2),
    kr20B: kr20ValueB.toFixed(2),
  };
}

function generateTableHTML(
  title: string,
  courses: any[],
  yearA: string,
  yearB: string,
  isLevel: boolean = true
) {
  const averages = calculateAverages(courses);

  return `
    <div class="table-container" style="margin-bottom: 20px;">
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <colgroup>
          <col style="width: 4%;">
          <col style="width: 20%;">
          <col style="width: 12%;">
          <col style="width: 12%;">
          <col style="width: 12%;">
          <col style="width: 12%;">
          <col style="width: 12%;">
          <col style="width: 12%;">
        </colgroup>
        <thead class="row-pair">
          <tr>
            <th colspan="2" class="border border-gray-300 bg-yellow-200 p-1">
              <p style="text-align: center; margin: 0; padding-top: 4px !important; padding-bottom: 14px !important;">${
                isLevel ? `LEVEL ${title}` : `DEPARTMENT: ${title}`
              }</p>
            </th>
            <th colspan="3" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; padding-top: 4px !important; padding-bottom: 14px !important;">${convertNumberToWord(
                courses[0]?.semisterA
              )} Semester, ${yearA}</p>
            </th>
            <th colspan="3" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; padding-top: 4px !important; padding-bottom: 14px !important;">${convertNumberToWord(
                courses[0]?.semisterB
              )} Semester, ${yearB}</p>
            </th>
          </tr>
          <tr>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">N</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: left; margin: 0; margin-bottom: 10px;">Course Title & Code</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">KR20</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
            <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">KR20</p></th>
          </tr>
        </thead>
        <tbody>
          ${courses
            .map(
              (course, index) => `
            <tbody class="row-pair">
              <tr>
                <td rowspan="2" class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  index + 1
                }</p></td>
                <td rowspan="2" class="border border-gray-300 p-1"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${
                  course.courseTitle
                } (${course.courseCode})</p></td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  formatNumber(course.yearA?.accepted)
                }</p></td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                    formatNumber(course.yearA?.rejected)
                }</p></td>
                <td rowspan="2" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${
                    course.yearA?.kr20 ? Number(course.yearA.kr20).toFixed(2) : "-"
                  }</p>
                </td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  formatNumber(course.yearB?.accepted)
                }</p></td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  formatNumber(course.yearB?.rejected)
                }</p></td>
                <td rowspan="2" class="border border-gray-300 p-1">
                  <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${
                    course.yearB?.kr20 ? Number(course.yearB.kr20).toFixed(2) : "-"
                  }</p>
                </td>
              </tr>
              <tr>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  course.yearA?.acceptedPercentage
                    ? Math.round(course.yearA.acceptedPercentage) + "%"
                    : ""
                }</p></td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  course.yearA?.rejectedPercentage
                    ? Math.round(course.yearA.rejectedPercentage) + "%"
                    : ""
                }</p></td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  course.yearB?.acceptedPercentage
                    ? Math.round(course.yearB.acceptedPercentage) + "%"
                    : ""
                }</p></td>
                <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
                  course.yearB?.rejectedPercentage
                    ? Math.round(course.yearB.rejectedPercentage) + "%"
                    : ""
                }</p></td>
              </tr>
            </tbody>
          `
            )
            .join("")}
          <tr class="row-pair">
            <td rowspan="2" colspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(averages.accepted)
            }</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(averages.rejected)
            }</p></td>
            <td rowspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatKRAverage(averages.kr20A)
            }</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(averages.acceptedB)
            }</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(averages.rejectedB)
            }</p></td>
            <td rowspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatKRAverage(averages.kr20B)
            }</p></td>
          </tr>
          <tr>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              averages.acceptedPercentageA ? averages.acceptedPercentageA : ""
            }%</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              averages.rejectedPercentageA ? averages.rejectedPercentageA : ""
            }%</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              averages.acceptedPercentageB ? averages.acceptedPercentageB : ""
            }%</p></td>
            <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              averages.rejectedPercentageB ? averages.rejectedPercentageB : ""
            }%</p></td>
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
          border: 1px solid #000000;
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

function processCoursesForComparison(
  courses: any[],
  semisterA: number,
  semisterB: number,
  yearA: string,
  yearB: string
) {
  const groupedByLevel: { [key: number]: any[] } = {};
  const groupedByDepartment: { [key: string]: any[] } = {};

  courses.forEach((course) => {
    const level = course.level;
    const department = course.department || "Uncategorized";
    const yearKey =
      yearA === yearB
        ? "yearA"
        : course.academic_year === yearA
        ? "yearA"
        : "yearB";
    const semister = course.semister;
    const section = course.section
      ? course.section.charAt(0).toUpperCase() +
        course.section.slice(1).toLowerCase()
      : ""; // Get the section (male/female)

    // Calculate question statistics
    let acceptedQuestions = 0;
    let rejectedQuestions = 0;

    course.krValues?.groupedItemAnalysisResults?.forEach((group: any) => {
      if (
        ["Good Questions", "Easy Questions", "Very Easy Questions"].includes(
          group.classification
        )
      ) {
        acceptedQuestions += group.questions?.length || 0;
      } else if (
        [
          "Poor (Bad) Questions",
          "Very Difficult Questions",
          "Difficult Questions",
        ].includes(group.classification)
      ) {
        rejectedQuestions += group.questions?.length || 0;
      }
    });

    const total = acceptedQuestions + rejectedQuestions;
    const courseData = {
      accepted: acceptedQuestions,
      rejected: rejectedQuestions,
      acceptedPercentage: total ? (acceptedQuestions / total) * 100 : 0,
      rejectedPercentage: total ? (rejectedQuestions / total) * 100 : 0,
      kr20: course.krValues?.KR_20 || 0,
      semister,
    };

    // Create a unique identifier that includes the course code and section
    const courseIdentifier = `${course.course_code}_${section}`;
    const displayTitle = `${course.course_name} (${
      section?.charAt(0).toUpperCase() + section?.slice(1)
    })`;

    // Group by level
    if (!groupedByLevel[level]) groupedByLevel[level] = [];
    const existingLevelCourse = groupedByLevel[level].find(
      (c) => c.courseIdentifier === courseIdentifier
    );
    if (existingLevelCourse) {
      if (yearA === yearB) {
        existingLevelCourse.yearA = courseData;
        existingLevelCourse.yearB = courseData;
      } else {
        const yearKey = course.academic_year === yearA ? "yearA" : "yearB";
        existingLevelCourse[yearKey] = courseData;
      }
    } else {
      groupedByLevel[level].push({
        courseIdentifier,
        courseCode: course.course_code,
        courseTitle: displayTitle,
        semisterA,
        semisterB,
        yearA:
          yearA === yearB
            ? courseData
            : course.academic_year === yearA
            ? courseData
            : undefined,
        yearB:
          yearA === yearB
            ? courseData
            : course.academic_year === yearB
            ? courseData
            : undefined,
      });
    }

    // Group by department
    if (!groupedByDepartment[department]) groupedByDepartment[department] = [];
    const existingDeptCourse = groupedByDepartment[department].find(
      (c) => c.courseIdentifier === courseIdentifier
    );
    if (existingDeptCourse) {
      if (yearA === yearB) {
        existingDeptCourse.yearA = courseData;
        existingDeptCourse.yearB = courseData;
      } else {
        const yearKey = course.academic_year === yearA ? "yearA" : "yearB";
        existingDeptCourse[yearKey] = courseData;
      }
    } else {
      groupedByDepartment[department].push({
        courseIdentifier,
        courseCode: course.course_code,
        courseTitle: displayTitle,
        semisterA,
        semisterB,
        yearA:
          yearA === yearB
            ? courseData
            : course.academic_year === yearA
            ? courseData
            : undefined,
        yearB:
          yearA === yearB
            ? courseData
            : course.academic_year === yearB
            ? courseData
            : undefined,
      });
    }
  });

  // Sort courses within each group
  Object.keys(groupedByLevel).forEach((level) => {
    groupedByLevel[Number(level)].sort((a, b) => {
      // First sort by course code
      const codeCompare = a.courseCode.localeCompare(b.courseCode);
      if (codeCompare !== 0) return codeCompare;
      // Then sort by section (Male before Female)
      return a.courseTitle.includes("Male") ? -1 : 1;
    });
  });

  Object.keys(groupedByDepartment).forEach((dept) => {
    groupedByDepartment[dept].sort((a, b) => {
      const codeCompare = a.courseCode.localeCompare(b.courseCode);
      if (codeCompare !== 0) return codeCompare;
      return a.courseTitle.includes("Male") ? -1 : 1;
    });
  });

  return { groupedByLevel, groupedByDepartment };
}


export async function compareYears({
  collegeId,
  semisterA,
  semisterB,
  yearA,
  yearB,
}: YearCompareParams) {
  const collegeObjectId = new Types.ObjectId(collegeId);

  // Fetch all courses including both sections
  const courses = await Course.find({
    collage: collegeObjectId,
    semister: { $in: [semisterA, semisterB] },
    academic_year: { $in: [yearA, yearB] },
  })
    .populate({
      path: "krValues",
      select: "KR_20 groupedItemAnalysisResults",
    })
    .lean();

  const { groupedByLevel, groupedByDepartment } = processCoursesForComparison(
    courses,
    semisterA,
    semisterB,
    yearA,
    yearB
  );

  // Generate HTML tables
  const levelTables = Object.entries(groupedByLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, courses]) =>
      generateTableHTML(level, courses, yearA, yearB, true)
    );

  const departmentTables = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) =>
      generateTableHTML(dept, courses, yearA, yearB, false)
    );

  // Generate summary tables with semester numbers
  const levelSummaryTable = generateSummaryTableHTML(
    "Level Summary",
    Object.entries(groupedByLevel)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, courses]) => ({
        name: level,
        averages: calculateAverages(courses),
        semisterA,
        semisterB,
      })),
    true,
    yearA,
    yearB
  );

  const departmentSummaryTable = generateSummaryTableHTML(
    "Department Summary",
    Object.entries(groupedByDepartment)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dept, courses]) => ({
        name: dept,
        averages: calculateAverages(courses),
        semisterA,
        semisterB,
      })),
    false,
    yearA,
    yearB
  );

  return {
    tables: [
      `<div class="logo-container">
        <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20C10 14.4772 14.4772 10 20 10H80C85.5228 10 90 14.4772 90 20C90 25.5228 85.5228 30 80 30H20C14.4772 30 10 25.5228 10 20Z" fill="#04b0fb"/>
          <text x="50" y="25" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Your Logo</text>
        </svg>
      </div>`,
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
          font-size: 7pt !important;
          margin-top: 5px !important;
          margin-bottom: 20px !important;
        }
        
        table:last-child {
          margin-bottom: 0 !important;
        }

        /* N column */
        tr td:first-child {
          width: 60px !important;
          max-width: 60px !important;
        }

        /* Course Title column */
        tr td:nth-child(2) {
          width: 240px !important;
          max-width: 240px !important;
          text-align: left !important;
          white-space: normal !important;
        }

        /* Headers */
        th[colspan="2"] {
          background-color: #04b0fb !important;
          text-align: left !important;
          width: 300px !important;
        }
        
        th[colspan="3"] {
          background-color: #f8f9fa !important;
        }

        /* Data columns */
        td:nth-child(n+3) {
          width: 80px !important;
          text-align: center !important;
        }

        /* Total rows */
        tr:last-child td,
        tr:nth-last-child(2) td {
          background-color: #f8f9fa !important;
        }

        /* Add logo styles */
        .logo-container {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 9999;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .tables-container {
            padding: 0;
            margin: 0;
          }
          
          div {
            break-inside: avoid !important;
            page-break-after: auto !important;
            page-break-before: auto !important;
          }
          
          .table-wrapper {
            margin: 15px 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
            page-break-before: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tr {
            page-break-inside: avoid !important;
          }

          .logo-container {
            position: fixed;
            top: 10px;
            right: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    `,
  };
}

function generateSummaryTableHTML(
  title: string,
  summaries: any[],
  isLevel: boolean = true,
  yearA: string,
  yearB: string
) {
  // Get semester numbers directly from the first summary
  const semesterA = summaries[0]?.semisterA || "-";
  const semesterB = summaries[0]?.semisterB || "-";

  // Calculate averages with null checks
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

  const avgAcceptedPercentageA = !isNaN(totalAcceptedA)
    ? Math.round(totalAcceptedA / summaries.length)
    : "0";
  const avgRejectedPercentageA = !isNaN(totalRejectedA)
    ? Math.round(totalRejectedA / summaries.length)
    : "0";
  const avgAcceptedPercentageB = !isNaN(totalAcceptedB)
    ? Math.round(totalAcceptedB / summaries.length)
    : "0";
  const avgRejectedPercentageB = !isNaN(totalRejectedB)
    ? Math.round(totalRejectedB / summaries.length)
    : "0";

  return `
    <table class="table-container mt-5 min-w-full border-collapse border rounded-md  overflow-hidden border-black" style="border-color: #000000 !important;">
      <colgroup>
        <col style="width: 40px;">
        <col style="width: 200px;">
        <col span="6" style="width: auto;">
      </colgroup>
      <thead class="row-pair">
        <tr>
          <th colspan="2" style="width: 300px !important;" class="border border-gray-300 bg-yellow-200 p-1" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0;  padding-top: 4px !important; padding-bottom: 14px !important;">${title}</p>
          </th>
          <th colspan="3" class="border border-gray-300 p-1" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0;  padding-top: 4px !important; padding-bottom: 14px !important;">${convertNumberToWord(
              semesterA
            )} Semester, ${yearA}</p>
          </th>
          <th colspan="3" class="border border-gray-300 p-1" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0;  padding-top: 4px !important; padding-bottom: 14px !important;">${convertNumberToWord(
              semesterB
            )} Semester, ${yearB}</p>
          </th>
        </tr>
        <tr>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">N</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${
            isLevel ? "Level" : "Department"
          }</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">KR20</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
          <th class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
        </tr>
      </thead>
      <tbody class="row-pair">
        ${summaries
          .map(
            (summary, index) => `
          <tr>
            <td rowspan="2" class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              index + 1
            }</p></td>
            <td rowspan="2" class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${
              isLevel ? `Level ${summary.name}` : `${summary.name}`
            }</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
             formatNumber(summary.averages.accepted)
            }</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(summary.averages.rejected)
            }</p></td>
            <td rowspan="2" class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${
              formatKRAverage(summary.averages.kr20A)
            }</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(summary.averages.acceptedB)
            }</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              formatNumber(summary.averages.rejectedB)
            }</p></td>
            <td rowspan="2" class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${
              formatKRAverage(summary.averages.kr20B)
            }</p></td>
          </tr>
          <tr>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              (isNaN(summary.averages.acceptedPercentageA) ||
               summary.averages.acceptedPercentageA === 0
               ? "-"
                : summary.averages.acceptedPercentageA)
            }%</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              (isNaN(summary.averages.rejectedPercentageA) ||
               summary.averages.rejectedPercentageA === 0
              ? "-"
                : summary.averages.rejectedPercentageA)
              
            }%</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              (isNaN(summary.averages.acceptedPercentageB) ||
               summary.averages.acceptedPercentageB === 0)
              ? "-"
                : summary.averages.acceptedPercentageB
            }%</p></td>
            <td class="border border-gray-300 p-1" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${
              (isNaN(summary.averages.rejectedPercentageB) ||
               summary.averages.rejectedPercentageB === 0)
             ? "-"
                : summary.averages.rejectedPercentageB
            }%</p></td>
          </tr>
        `
          )
          .join("")}
        <tr class="row-pair">
          <td rowspan="2" colspan="2" class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p></td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(
            summaries.reduce((acc, curr) => acc + curr.averages.accepted, 0) /
              summaries.length
          )}</p></td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(
            summaries.reduce((acc, curr) => acc + curr.averages.rejected, 0) /
              summaries.length
          )}</p></td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${(
            summaries.reduce((acc, curr) => acc + Number(curr.averages.kr20A || 0), 0) / summaries.length
          ).toFixed(2)}</p></td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(
            summaries.reduce((acc, curr) => acc + curr.averages.acceptedB, 0) /
              summaries.length
          )}</p></td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(
            summaries.reduce((acc, curr) => acc + curr.averages.rejectedB, 0) /
              summaries.length
          )}</p></td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${(
            summaries.reduce((acc, curr) => acc + Number(curr.averages.kr20B || 0), 0) / summaries.length
          ).toFixed(2)}</p></td>
        </tr>
        <tr>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgAcceptedPercentageA}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgRejectedPercentageA}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgAcceptedPercentageB}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold" style="border-color: #000000 !important;" >
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgRejectedPercentageB}%</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}
