import { Types } from "mongoose";
import { Course } from "@/lib/models";
import { formatNew, formatPercentage } from "../utils/format.utils";
// import logger from "@/lib/logger";
import { convertNumberToWord } from "@/lib/utils/number-to-word";

interface SemesterAnalysisParams {
  collegeId: string;
  semester: number;
  academicYear: string;
}

function calculateQuestionStats(course: any) {
  const stats = {
    goodQuestions: 0,
    easyQuestions: 0,
    veryEasyQuestions: 0,
    poorQuestions: 0,
    difficultQuestions: 0,
    veryDifficultQuestions: 0,
    kr20: Number(course.krValues?.KR_20) || 0,
  };


  course.krValues?.groupedItemAnalysisResults?.forEach((group: any) => {
    switch (group.classification) {
      case "Good Questions":
        stats.goodQuestions = group.questions?.length || 0;
        break;
      case "Easy Questions":
        stats.easyQuestions = group.questions?.length || 0;
        break;
      case "Very Easy Questions":
        stats.veryEasyQuestions = group.questions?.length || 0;
        break;
      case "Poor (Bad) Questions":
        stats.poorQuestions = group.questions?.length || 0;
        break;
      case "Difficult Questions":
        stats.difficultQuestions = group.questions?.length || 0;
        break;
      case "Very Difficult Questions":
        stats.veryDifficultQuestions = group.questions?.length || 0;
        break;
    }
  });

  const totalAccepted = Math.round(
    stats.goodQuestions + stats.easyQuestions + stats.difficultQuestions
  );
  const totalRejected = Math.round(
    stats.veryDifficultQuestions + stats.poorQuestions + stats.veryEasyQuestions
  );



  const percentages = {
    goodQuestions:
      totalAccepted > 0
        ? Math.round((stats.goodQuestions / totalAccepted) * 100)
        : 0,
    easyQuestions:
      totalAccepted > 0
        ? Math.round((stats.easyQuestions / totalAccepted) * 100)
        : 0,
    difficultQuestions:
      totalAccepted > 0
        ? Math.round((stats.difficultQuestions / totalAccepted) * 100)
        : 0,
    veryDifficultQuestions:
      totalRejected > 0
        ? Math.round((stats.veryDifficultQuestions / totalRejected) * 100)
        : 0,
    poorQuestions:
      totalRejected > 0
        ? Math.round((stats.poorQuestions / totalRejected) * 100)
        : 0,
    veryEasyQuestions:
      totalRejected > 0
        ? Math.round((stats.veryEasyQuestions / totalRejected) * 100)
        : 0,
  };


  return {
    ...stats,
    totalAccepted,
    totalRejected,
    percentages,
  };
}

function calculateAverages(courses: any[]) {
  const totals = courses.reduce(
    (acc, course) => {
      const stats = calculateQuestionStats(course);
      return {
        goodQuestions: acc.goodQuestions + stats.goodQuestions,
        easyQuestions: acc.easyQuestions + stats.easyQuestions,
        difficultQuestions: acc.difficultQuestions + stats.difficultQuestions,
        veryDifficultQuestions:
          acc.veryDifficultQuestions + stats.veryDifficultQuestions,
        poorQuestions: acc.poorQuestions + stats.poorQuestions,
        veryEasyQuestions: acc.veryEasyQuestions + stats.veryEasyQuestions,
        kr20: acc.kr20 + stats.kr20,
      };
    },
    {
      goodQuestions: 0,
      easyQuestions: 0,
      difficultQuestions: 0,
      veryDifficultQuestions: 0,
      poorQuestions: 0,
      veryEasyQuestions: 0,
      kr20: 0,
    }
  );

  // logger.info(totals);
  const count = courses.length || 1;
  const totalAccepted =
    totals.goodQuestions + totals.easyQuestions + totals.difficultQuestions;
  const totalRejected =
    totals.veryDifficultQuestions +
    totals.poorQuestions +
    totals.veryEasyQuestions;
  const total = totalAccepted + totalRejected;

  const kr20Value = totals.kr20 / count;

  // logger.info({
  //   goodQuestions: Math.round(totals.goodQuestions / count),
  //   easyQuestions: Math.round(totals.easyQuestions / count),
  //   difficultQuestions: Math.round(totals.difficultQuestions / count),
  //   veryDifficultQuestions: Math.round(totals.veryDifficultQuestions / count),
  //   poorQuestions: Math.round(totals.poorQuestions / count),
  //   veryEasyQuestions: Math.round(totals.veryEasyQuestions / count),
  //   totalAccepted: Math.round(totalAccepted / count),
  //   totalRejected: Math.round(totalRejected / count),
  //   kr20: kr20Value.toFixed(2),
  //   percentages: {
  //     goodQuestions: Math.round((totals.goodQuestions / totalAccepted) * 100),
  //     easyQuestions: Math.round((totals.easyQuestions / totalAccepted) * 100),
  //     difficultQuestions: Math.round(
  //       (totals.difficultQuestions / totalAccepted) * 100
  //     ),
  //     veryDifficultQuestions: Math.round(
  //       (totals.veryDifficultQuestions / totalRejected) * 100
  //     ),
  //     poorQuestions: Math.round((totals.poorQuestions / totalRejected) * 100),
  //     veryEasyQuestions: Math.round(
  //       (totals.veryEasyQuestions / totalRejected) * 100
  //     ),
  //   },
  // });

  const rawAverages = {
    goodQuestions: totals.goodQuestions / count,
    easyQuestions: totals.easyQuestions / count,
    difficultQuestions: totals.difficultQuestions / count,
    veryDifficultQuestions: totals.veryDifficultQuestions / count,
    poorQuestions: totals.poorQuestions / count,
    veryEasyQuestions: totals.veryEasyQuestions / count,
    totalAccepted: totalAccepted / count,
    totalRejected: totalRejected / count,
    kr20: kr20Value,
  };

  return {
    goodQuestions: rawAverages.goodQuestions.toFixed(1),
    easyQuestions: rawAverages.easyQuestions.toFixed(1),
    difficultQuestions: rawAverages.difficultQuestions.toFixed(1),
    veryDifficultQuestions: rawAverages.veryDifficultQuestions.toFixed(1),
    poorQuestions: rawAverages.poorQuestions.toFixed(1),
    veryEasyQuestions: rawAverages.veryEasyQuestions.toFixed(1),
    totalAccepted: rawAverages.totalAccepted.toFixed(1),
    totalRejected: rawAverages.totalRejected.toFixed(1),
    kr20: kr20Value.toFixed(2),
    raw: rawAverages,
    percentages: {
      goodQuestions: ((totals.goodQuestions / totalAccepted) * 100).toFixed(1),
      easyQuestions: ((totals.easyQuestions / totalAccepted) * 100).toFixed(1),
      difficultQuestions: ((totals.difficultQuestions / totalAccepted) * 100).toFixed(1),
      veryDifficultQuestions: ((totals.veryDifficultQuestions / totalRejected) * 100).toFixed(1),
      poorQuestions: ((totals.poorQuestions / totalRejected) * 100).toFixed(1),
      veryEasyQuestions: ((totals.veryEasyQuestions / totalRejected) * 100).toFixed(1),
    },
  };
}

function generateTableHTML(
  title: string,
  courses: any[],
  semester: number,
  year: string,
  isLevel: boolean = true
) {
  const averages = calculateAverages(courses);

  return `
    <div class="table-container" style="margin-bottom: 20px;">
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <colgroup>
          <col style="width: 4%;">
          <col style="width: 20%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
          <col style="width: 7.6%;">
        </colgroup>
        <thead>
          <tr>
            <th colspan="2" style="width: 300px !important;" class="border border-black bg-yellow-200 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${isLevel ? `LEVEL ${title}` : ` ${title}`
    }</p>
            </th>
            <th colspan="9" class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${convertNumberToWord(
      semester
    )} Semester, ${year}</p>
            </th>
          </tr>
          <tr>
            <th style="width: 30px !important;" class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">S.No</p>
            </th>
            <th style="width: 270px !important;" class="border border-black p-1">
              <p style="text-align: left; margin: 0; margin-bottom: 10px;">Course Title & Code</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Good Questions</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Easy Questions</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Difficult Questions</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Accepted</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Difficult Questions</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Poor (Bad) Questions</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Easy Questions</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Rejected</p>
            </th>
            <th class="border border-black" style="padding: 2px 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p>
            </th>
          </tr>
        </thead>
        <tbody>
          ${courses
      .map((course, index) => {
        const stats = calculateQuestionStats(course);
        const sectionText = course.section
          ? ` (${course.section.charAt(0).toUpperCase() +
          course.section.slice(1).toLowerCase()
          })`
          : "";
        return `
              <tbody class="row-pair">
                <tr>
                  <td rowspan="2" style="width: 30px !important;" class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1
          }</p>
                  </td>
                  <td rowspan="2" style="width: 270px !important;" class="border border-black p-1">
                    <p style="text-align: left; margin: 0; margin-bottom: 10px;">${course.course_name
          } (${course.course_code})${sectionText}</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.goodQuestions === 0 || isNaN(stats.goodQuestions) ? "-" : stats.goodQuestions
          }</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.easyQuestions === 0 || isNaN(stats.easyQuestions) ? "-" : stats.easyQuestions
          }</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.difficultQuestions === 0 || isNaN(stats.difficultQuestions) ? "-" : stats.difficultQuestions
          }</p>
                  </td>
                  <td rowspan="2" class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.totalAccepted === 0 || isNaN(stats.totalAccepted) ? "-" : stats.totalAccepted
          }</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.veryDifficultQuestions === 0 || isNaN(stats.veryDifficultQuestions) ? "-" : stats.veryDifficultQuestions
          }</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.poorQuestions === 0 || isNaN(stats.poorQuestions) ? "-" : stats.poorQuestions
          }</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.veryEasyQuestions === 0 || isNaN(stats.veryEasyQuestions) ? "-" : stats.veryEasyQuestions
          }</p>
                  </td>
                  <td rowspan="2" class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.totalRejected === 0 || isNaN(stats.totalRejected) ? "-" : stats.totalRejected
          }</p>
                  </td>
                  <td rowspan="2" class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${Number(stats.kr20) === 0 || isNaN(Number(stats.kr20)) ? "-" : Number(stats.kr20).toFixed(2)
          }</p>
                  </td>
                </tr>
                <tr>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatPercentage(
            (stats.goodQuestions / stats.totalAccepted) * 100
          )}</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatPercentage(
            (stats.easyQuestions / stats.totalAccepted) * 100
          )}</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatPercentage(
            (stats.difficultQuestions / stats.totalAccepted) * 100
          )}</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatPercentage(
            (stats.veryDifficultQuestions / stats.totalRejected) * 100
          )}</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatPercentage(
            (stats.poorQuestions / stats.totalRejected) * 100
          )}</p>
                  </td>
                  <td class="border border-black p-1">
                    <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatPercentage(
            (stats.veryEasyQuestions / stats.totalRejected) * 100
          )}</p>
                  </td>
                </tr>
              </tbody>
            `;
      })
      .join("")}
          <tr>
            <td rowspan="2" colspan="2" class="border border-black p-1 font-bold" style="width: 30px !important; max-width: 30px !important;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.goodQuestions}</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.easyQuestions}</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.difficultQuestions}</p>
            </td>
            <td rowspan="2" class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.totalAccepted}</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.veryDifficultQuestions}</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.poorQuestions}</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.veryEasyQuestions}</p>
            </td>
            <td rowspan="2" class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.totalRejected}</p>
            </td>
            <td rowspan="2" class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${Number(averages.kr20) === 0 || isNaN(Number(averages.kr20)) ? "-" : Number(averages.kr20)
    }</p>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.percentages.goodQuestions}%</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.percentages.easyQuestions}%</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.percentages.difficultQuestions}%</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;font-weight: bold;">${averages.percentages.veryDifficultQuestions}%</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;font-weight: bold;">${averages.percentages.poorQuestions}%</p>
            </td>
            <td class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold;">${averages.percentages.veryEasyQuestions}%</p>
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
          border: 1px solid #000;
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

function generateKR20SegregationHTML(courses: any[]) {
  // Group courses by KR20 ranges
  const goodExams = courses.filter((c) => c.krValues?.KR_20 >= 0.8);
  const averageExams = courses.filter(
    (c) => c.krValues?.KR_20 >= 0.7 && c.krValues?.KR_20 < 0.8
  );
  const badExams = courses.filter(
    (c) => c.krValues?.KR_20 < 0.7 || !c.krValues?.KR_20
  );

  return `
    <div class="kr20-segregation" style="width: 100%; margin-bottom: 40px; border: 1px solid #000;overflow:hidden; border-radius: 8px; page-break-inside: avoid;">
      <h2 style="text-align: center; font-size: 16px; font-weight: bold; padding: 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; margin: 0; margin-top: -16px;">
        Observation of individual courses
      </h2>
      
      <div style="padding: 16px;">
        <div class="exam-category good">
          <h3 style="color: #16a34a; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
            Good Exams (KR20 ≥ 0.80)
          </h3>
          <ul style="list-style-type: none; padding-left: 16px; margin: 0;">
            ${goodExams
      .map(
        (course) => `
              <li style="margin-bottom: 4px; font-size: 12px;">
                ${course.course_name} (${course.course_code})
                ${course.section
            ? `${course.section.charAt(0).toUpperCase() +
            course.section.slice(1).toLowerCase()
            }`
            : ""
          } 
                - KR20: ${course.krValues?.KR_20
            ? course.krValues.KR_20.toFixed(3)
            : "N/A"
          }
              </li>
            `
      )
      .join("")}
            ${goodExams.length === 0
      ? '<li style="color: #64748b; font-size: 12px;">No courses found</li>'
      : ""
    }
          </ul>
        </div>

        <div class="exam-category average" style="margin-top: 16px;">
          <h3 style="color: #ca8a04; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
            Average Exams (KR20: 0.70-0.79)
          </h3>
          <ul style="list-style-type: none; padding-left: 16px; margin: 0;">
            ${averageExams
      .map(
        (course) => `
              <li style="margin-bottom: 4px; font-size: 12px;">
                ${course.course_name} (${course.course_code})
                ${course.section
            ? `${course.section.charAt(0).toUpperCase() +
            course.section.slice(1).toLowerCase()
            }`
            : ""
          } 
                - KR20: ${course.krValues?.KR_20
            ? course.krValues.KR_20.toFixed(3)
            : "N/A"
          }
              </li>
            `
      )
      .join("")}
            ${averageExams.length === 0
      ? '<li style="color: #64748b; font-size: 12px;">No courses found</li>'
      : ""
    }
          </ul>
        </div>

        <div class="exam-category bad" style="margin-top: 16px;">
          <h3 style="color: #dc2626; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
            Bad Exams (KR20 < 0.70)
          </h3>
          <ul style="list-style-type: none; padding-left: 16px; margin: 0;">
            ${badExams
      .map(
        (course) => `
              <li style="margin-bottom: 4px; font-size: 12px;">
                ${course.course_name} (${course.course_code})
                ${course.section
            ? `${course.section.charAt(0).toUpperCase() +
            course.section.slice(1).toLowerCase()
            }`
            : ""
          } 
                - KR20: ${course.krValues?.KR_20
            ? course.krValues.KR_20.toFixed(3)
            : "N/A"
          }
              </li>
            `
      )
      .join("")}
            ${badExams.length === 0
      ? '<li style="color: #64748b; font-size: 12px;">No courses found</li>'
      : ""
    }
          </ul>
        </div>
      </div>
    </div>
  `;
}

export async function analyzeSemester({
  collegeId,
  semester,
  academicYear,
}: SemesterAnalysisParams) {
  const collegeObjectId = new Types.ObjectId(collegeId);

  const courses = await Course.find({
    collage: collegeObjectId,
    semister: semester,
    academic_year: academicYear,
    examType:'final'
  })
    .select("course_name course_code level department section krValues")
    .populate({
      path: "krValues",
      select: "KR_20 groupedItemAnalysisResults",
    })
    .lean();

  // Group courses by level and department
  const groupedByLevel: { [key: number]: any[] } = {};
  const groupedByDepartment: { [key: string]: any[] } = {};

  courses.forEach((course) => {
    const level = course.level;
    const department = course.department || "Uncategorized";

    if (!groupedByLevel[level]) groupedByLevel[level] = [];
    groupedByLevel[level].push(course);

    if (!groupedByDepartment[department]) groupedByDepartment[department] = [];
    groupedByDepartment[department].push(course);
  });

  const levelTables = Object.entries(groupedByLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, courses]) =>
      generateTableHTML(level, courses, semester, academicYear, true)
    );

  const departmentTables = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) =>
      generateTableHTML(dept, courses, semester, academicYear, false)
    );

  // Collect averages for summary tables
  const levelSummaries = Object.entries(groupedByLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, courses]) => ({
      name: level,
      averages: calculateAverages(courses),
    }));

  const departmentSummaries = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) => ({
      name: dept,
      averages: calculateAverages(courses),
    }));

  // Generate summary tables HTML
  const levelSummaryTable = generateSummaryTableHTML(
    "Level Summary",
    levelSummaries,
    true
  );
  const departmentSummaryTable = generateSummaryTableHTML(
    "Department Summary",
    departmentSummaries,
    false
  );

  // Add KR20 segregation before the tables
  const kr20SegregationHTML = generateKR20SegregationHTML(courses);

  return {
    tables: [
      kr20SegregationHTML,
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
          width: 40px !important;
          max-width: 40px !important;
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
          background-color: #01b9fe !important;
          text-align: left !important;
          width: 300px !important;
        }
        
        th[colspan="8"] {
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

        /* Extremely specific selector for S.No column */
        table tbody tr td.sno-column,
        table thead tr th.sno-column {
          width: 25px !important;
          min-width: 25px !important;
          max-width: 25px !important;
          padding: 1px !important;
          box-sizing: border-box !important;
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
        }

        .kr20-segregation {
          background-color: white;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          margin-bottom: 20px !important;
        }
        
        .exam-category h3 {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .exam-category h3::before {
          content: '';
          display: inline-block;
          width: 8px;
          margin-top: 14px;
          height: 8px;
          border-radius: 50%;
        }
        
      .exam-category.good h3::before { background-color: #16a34a; }
.exam-category.average h3::before { background-color: #ca8a04; }
.exam-category.bad h3::before { background-color: #dc2626; }

        .kr20-segregation {
          page-break-inside: auto;
        }
        .exam-category {
          page-break-inside: avoid;
          page-break-after: auto;
        }
      </style>
    `,
  };
}

function generateSummaryTableHTML(
  title: string,
  summaries: any[],
  isLevel: boolean = true
) {
  // Calculate the overall averages from all summaries using raw numbers
  const overallAverages = summaries.reduce(
    (acc, summary) => ({
      goodQuestions: acc.goodQuestions + summary.averages.raw.goodQuestions,
      easyQuestions: acc.easyQuestions + summary.averages.raw.easyQuestions,
      difficultQuestions:
        acc.difficultQuestions + summary.averages.raw.difficultQuestions,
      veryDifficultQuestions:
        acc.veryDifficultQuestions + summary.averages.raw.veryDifficultQuestions,
      poorQuestions: acc.poorQuestions + summary.averages.raw.poorQuestions,
      veryEasyQuestions:
        acc.veryEasyQuestions + summary.averages.raw.veryEasyQuestions,
      totalAccepted: acc.totalAccepted + summary.averages.raw.totalAccepted,
      totalRejected: acc.totalRejected + summary.averages.raw.totalRejected,
      kr20: acc.kr20 + summary.averages.raw.kr20,
    }),
    {
      goodQuestions: 0,
      easyQuestions: 0,
      difficultQuestions: 0,
      veryDifficultQuestions: 0,
      poorQuestions: 0,
      veryEasyQuestions: 0,
      totalAccepted: 0,
      totalRejected: 0,
      kr20: 0,
    }
  );

  const count = summaries.length || 1;
  const finalAverages = {
    goodQuestions: (overallAverages.goodQuestions / count).toFixed(1),
    easyQuestions: (overallAverages.easyQuestions / count).toFixed(1),
    difficultQuestions: (overallAverages.difficultQuestions / count).toFixed(1),
    veryDifficultQuestions: (overallAverages.veryDifficultQuestions / count).toFixed(1),
    poorQuestions: (overallAverages.poorQuestions / count).toFixed(1),
    veryEasyQuestions: (overallAverages.veryEasyQuestions / count).toFixed(1),
    totalAccepted: (overallAverages.totalAccepted / count).toFixed(1),
    totalRejected: (overallAverages.totalRejected / count).toFixed(1),
    kr20: (overallAverages.kr20 / count).toFixed(2),
  };

  const total = overallAverages.totalAccepted + overallAverages.totalRejected;
  const percentages = {
    goodQuestions: formatPercentage(
      (overallAverages.goodQuestions / total) * 100
    ),
    easyQuestions: formatPercentage(
      (overallAverages.easyQuestions / total) * 100
    ),
    difficultQuestions: formatPercentage(
      (overallAverages.difficultQuestions / total) * 100
    ),
    veryDifficultQuestions: formatPercentage(
      (overallAverages.veryDifficultQuestions / total) * 100
    ),
    poorQuestions: formatPercentage(
      (overallAverages.poorQuestions / total) * 100
    ),
    veryEasyQuestions: formatPercentage(
      (overallAverages.veryEasyQuestions / total) * 100
    ),
  };

  return `
    <table class="table-container mt-3 min-w-full border-collapse border rounded-md overflow-hidden border-black">
      <colgroup>
        <col style="width: 40px;">
        <col style="width: 200px;">
        <col span="9" style="width: auto;">
      </colgroup>
      <thead class="row-pair">
        <tr>
          <th colspan="2" style="width: 300px !important;" class="border border-black bg-yellow-200 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${title}</p>
          </th>
          <th colspan="9" class="border border-black p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Summary</p>
          </th>
        </tr>
        <tr>
          <th style="width: 30px !important;" class="border border-black p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">S.No</p>
          </th>
          <th style="width: 270px !important;" class="border border-black p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel ? "Level" : "Department"
    }</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Good Questions</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Easy Questions</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Difficult Questions</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Accepted</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Difficult Questions</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Poor (Bad) Questions</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Easy Questions</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Rejected</p>
          </th>
          <th class="border border-black" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p>
          </th>
        </tr>
      </thead>
      <tbody class="row-pair">
        ${summaries
      .map(
        (summary, index) => `
          <tr>
            <td rowspan="2" style="width: 30px !important;" class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1
          }</p>
            </td>
            <td rowspan="2" style="width: 270px !important;" class="border border-black p-1">
              <p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel
            ? `Level ${summary.name}`
            : ` ${summary.name}`
          }</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.goodQuestions)
          }</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.easyQuestions)
          }</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.difficultQuestions)
          }</p>
            </td>
            <td rowspan="2" class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.totalAccepted)
          }</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.veryDifficultQuestions)
          }</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.poorQuestions)
          }</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.veryEasyQuestions)
          }</p>
            </td>
            <td rowspan="2" class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${formatNew(summary.averages.totalRejected)
          }</p>
            </td>
            <td rowspan="2" class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${Number(summary.averages.kr20) === 0 || isNaN(Number(summary.averages.kr20)) ? "-" : Number(summary.averages.kr20).toFixed(2)
          }</p>
            </td>
          </tr>
          <tr>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.goodQuestions}%</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.easyQuestions}%</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.difficultQuestions}%</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.veryDifficultQuestions}%</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.poorQuestions}%</p>
            </td>
            <td class="border border-black p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.veryEasyQuestions}%</p>
            </td>
          </tr>
        `
      )
      .join("")}
        
        <tr>
          <td rowspan="2" colspan="2" class="border border-black p-1 font-bold" style="text-align: center;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.goodQuestions}</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.easyQuestions}</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.difficultQuestions}</p>
          </td>
          <td rowspan="2" class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.totalAccepted}</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.veryDifficultQuestions}</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.poorQuestions}</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.veryEasyQuestions}</p>
          </td>
          <td rowspan="2" class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.totalRejected}</p>
          </td>
          <td rowspan="2" class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${(
      summaries.reduce((acc, curr) => acc + Number(curr.averages.kr20 || 0), 0) / summaries.length
    ).toFixed(2)}</p>
          </td>
        </tr>
        <tr>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.goodQuestions
    }</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.easyQuestions
    }</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.difficultQuestions
    }</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.veryDifficultQuestions
    }</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.poorQuestions
    }</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.veryEasyQuestions
    }</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}
