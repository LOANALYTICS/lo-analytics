import { Types } from 'mongoose';
import { Course } from '@/lib/models';

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
    kr20: course.krValues?.KR_20 || 0
  };

  course.krValues?.groupedItemAnalysisResults?.forEach((group: any) => {
    switch(group.classification) {
      case 'Good Questions':
        stats.goodQuestions = group.questions?.length || 0;
        break;
      case 'Easy Questions':
        stats.easyQuestions = group.questions?.length || 0;
        break;
      case 'Very Easy Questions':
        stats.veryEasyQuestions = group.questions?.length || 0;
        break;
      case 'Poor (Bad) Questions':
        stats.poorQuestions = group.questions?.length || 0;
        break;
      case 'Difficult Questions':
        stats.difficultQuestions = group.questions?.length || 0;
        break;
      case 'Very Difficult Questions':
        stats.veryDifficultQuestions = group.questions?.length || 0;
        break;
    }
  });

  const totalAccepted = stats.goodQuestions + stats.easyQuestions + stats.difficultQuestions;
  const totalRejected = stats.veryDifficultQuestions + stats.poorQuestions + stats.veryEasyQuestions;

  return {
    ...stats,
    totalAccepted,
    totalRejected
  };
}

function calculateAverages(courses: any[]) {
  const totals = courses.reduce((acc, course) => {
    const stats = calculateQuestionStats(course);
    return {
      goodQuestions: acc.goodQuestions + stats.goodQuestions,
      easyQuestions: acc.easyQuestions + stats.easyQuestions,
      difficultQuestions: acc.difficultQuestions + stats.difficultQuestions,
      veryDifficultQuestions: acc.veryDifficultQuestions + stats.veryDifficultQuestions,
      poorQuestions: acc.poorQuestions + stats.poorQuestions,
      veryEasyQuestions: acc.veryEasyQuestions + stats.veryEasyQuestions,
      kr20: acc.kr20 + stats.kr20
    };
  }, {
    goodQuestions: 0, easyQuestions: 0, difficultQuestions: 0,
    veryDifficultQuestions: 0, poorQuestions: 0, veryEasyQuestions: 0, kr20: 0
  });

  const count = courses.length || 1;
  const totalAccepted = totals.goodQuestions + totals.easyQuestions + totals.difficultQuestions;
  const totalRejected = totals.veryDifficultQuestions + totals.poorQuestions + totals.veryEasyQuestions;
  const total = totalAccepted + totalRejected;

  return {
    goodQuestions: Math.round(totals.goodQuestions / count),
    easyQuestions: Math.round(totals.easyQuestions / count),
    difficultQuestions: Math.round(totals.difficultQuestions / count),
    veryDifficultQuestions: Math.round(totals.veryDifficultQuestions / count),
    poorQuestions: Math.round(totals.poorQuestions / count),
    veryEasyQuestions: Math.round(totals.veryEasyQuestions / count),
    totalAccepted: Math.round(totalAccepted / count),
    totalRejected: Math.round(totalRejected / count),
    kr20: Number((totals.kr20 / count).toFixed(2)),
    percentages: {
      goodQuestions: ((totals.goodQuestions / total) * 100).toFixed(2),
      easyQuestions: ((totals.easyQuestions / total) * 100).toFixed(2),
      difficultQuestions: ((totals.difficultQuestions / total) * 100).toFixed(2),
      veryDifficultQuestions: ((totals.veryDifficultQuestions / total) * 100).toFixed(2),
      poorQuestions: ((totals.poorQuestions / total) * 100).toFixed(2),
      veryEasyQuestions: ((totals.veryEasyQuestions / total) * 100).toFixed(2)
    }
  };
}

function generateTableHTML(title: string, courses: any[], semester: number, year: string, isLevel: boolean = true) {
  const averages = calculateAverages(courses);
  
  return `
    <table class="min-w-full border-collapse border border-gray-300">
      <colgroup>
        <col style="width: 40px;">
        <col style="width: 200px;">
        <col span="9" style="width: auto;">
      </colgroup>
      <thead>
        <tr>
          <th colspan="2" style="width: 300px !important;" class="border border-gray-300 bg-yellow-200 p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel ? `LEVEL ${title}` : `DEPARTMENT: ${title}`}</p>
          </th>
          <th colspan="8" class="border border-gray-300 p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">Semester ${semester}, ${year}</p>
          </th>
        </tr>
        <tr>
          <th style="width: 30px !important;" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">S.No</p>
          </th>
          <th style="width: 270px !important;" class="border border-gray-300 p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">Course Title & Code</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Good Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Easy Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Difficult Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Accepted</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Difficult Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Poor (Bad) Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Easy Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Rejected</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p>
          </th>
        </tr>
      </thead>
      <tbody>
        ${courses.map((course, index) => {
          const stats = calculateQuestionStats(course);
          const sectionText = course.section ? ` (${course.section.toUpperCase()})` : '';
          return `
            <tr>
              <td rowspan="2" style="width: 30px !important;" class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1}</p>
              </td>
              <td rowspan="2" style="width: 270px !important;" class="border border-gray-300 p-1">
                <p style="text-align: left; margin: 0; margin-bottom: 10px;">${course.course_name} (${course.course_code})${sectionText}</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.goodQuestions}</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.easyQuestions}</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.difficultQuestions}</p>
              </td>
              <td rowspan="2" class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.totalAccepted}</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.veryDifficultQuestions}</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.poorQuestions}</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.veryEasyQuestions}</p>
              </td>
              <td rowspan="2" class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.totalRejected}</p>
              </td>
              <td rowspan="2" class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${stats.kr20.toFixed(2)}</p>
              </td>
            </tr>
            <tr>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${((stats.goodQuestions / stats.totalAccepted) * 100).toFixed(2)}%</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${((stats.easyQuestions / stats.totalAccepted) * 100).toFixed(2)}%</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${((stats.difficultQuestions / stats.totalAccepted) * 100).toFixed(2)}%</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${((stats.veryDifficultQuestions / stats.totalAccepted) * 100).toFixed(2)}%</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${((stats.poorQuestions / stats.totalAccepted) * 100).toFixed(2)}%</p>
              </td>
              <td class="border border-gray-300 p-1">
                <p style="text-align: center; margin: 0; margin-bottom: 10px;">${((stats.veryEasyQuestions / stats.totalAccepted) * 100).toFixed(2)}%</p>
              </td>
            </tr>
          `;
        }).join('')}
        <tr>
          <td rowspan="2" colspan="2" class="border border-gray-300 p-1 font-bold" style="width: 30px !important; max-width: 30px !important;">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">Average</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.goodQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.easyQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.difficultQuestions}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.totalAccepted}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.veryDifficultQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.poorQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.veryEasyQuestions}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.totalRejected}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.kr20}</p>
          </td>
        </tr>
        <tr>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.percentages.goodQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.percentages.easyQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.percentages.difficultQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.percentages.veryDifficultQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.percentages.poorQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.percentages.veryEasyQuestions}%</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

export async function analyzeSemester({
  collegeId,
  semester,
  academicYear
}: SemesterAnalysisParams) {
  const collegeObjectId = new Types.ObjectId(collegeId);

  const courses = await Course.find({
    collage: collegeObjectId,
    semister: semester,
    academic_year: academicYear
  })
  .select('course_name course_code level department section krValues')
  .populate({
    path: 'krValues',
    select: 'KR_20 groupedItemAnalysisResults'
  })
  .lean();

  // Group courses by level and department
  const groupedByLevel: { [key: number]: any[] } = {};
  const groupedByDepartment: { [key: string]: any[] } = {};

  courses.forEach(course => {
    const level = course.level;
    const department = course.department || 'Uncategorized';

    if (!groupedByLevel[level]) groupedByLevel[level] = [];
    groupedByLevel[level].push(course);

    if (!groupedByDepartment[department]) groupedByDepartment[department] = [];
    groupedByDepartment[department].push(course);
  });

  const levelTables = Object.entries(groupedByLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, courses]) => generateTableHTML(level, courses, semester, academicYear, true));

  const departmentTables = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) => generateTableHTML(dept, courses, semester, academicYear, false));

  // Collect averages for summary tables
  const levelSummaries = Object.entries(groupedByLevel)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, courses]) => ({
      name: level,
      averages: calculateAverages(courses)
    }));

  const departmentSummaries = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) => ({
      name: dept,
      averages: calculateAverages(courses)
    }));

  // Generate summary tables HTML
  const levelSummaryTable = generateSummaryTableHTML('Level Summary', levelSummaries, true);
  const departmentSummaryTable = generateSummaryTableHTML('Department Summary', departmentSummaries, false);

  return {
    tables: [...levelTables, ...departmentTables, levelSummaryTable, departmentSummaryTable],
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
          margin-bottom: 40px !important;
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
          background-color: #ffd700 !important;
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
          font-weight: bold !important;
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
          }
          
          .table-wrapper {
            margin: 15px 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      </style>
    `
  };
}

function generateSummaryTableHTML(title: string, summaries: any[], isLevel: boolean = true) {
  // Calculate the overall averages from all summaries
  const overallAverages = summaries.reduce((acc, summary) => ({
    goodQuestions: acc.goodQuestions + summary.averages.goodQuestions,
    easyQuestions: acc.easyQuestions + summary.averages.easyQuestions,
    difficultQuestions: acc.difficultQuestions + summary.averages.difficultQuestions,
    veryDifficultQuestions: acc.veryDifficultQuestions + summary.averages.veryDifficultQuestions,
    poorQuestions: acc.poorQuestions + summary.averages.poorQuestions,
    veryEasyQuestions: acc.veryEasyQuestions + summary.averages.veryEasyQuestions,
    totalAccepted: acc.totalAccepted + summary.averages.totalAccepted,
    totalRejected: acc.totalRejected + summary.averages.totalRejected,
    kr20: acc.kr20 + summary.averages.kr20
  }), {
    goodQuestions: 0, easyQuestions: 0, difficultQuestions: 0,
    veryDifficultQuestions: 0, poorQuestions: 0, veryEasyQuestions: 0,
    totalAccepted: 0, totalRejected: 0, kr20: 0
  });

  const count = summaries.length || 1;
  const finalAverages = {
    goodQuestions: Math.round(overallAverages.goodQuestions / count),
    easyQuestions: Math.round(overallAverages.easyQuestions / count),
    difficultQuestions: Math.round(overallAverages.difficultQuestions / count),
    veryDifficultQuestions: Math.round(overallAverages.veryDifficultQuestions / count),
    poorQuestions: Math.round(overallAverages.poorQuestions / count),
    veryEasyQuestions: Math.round(overallAverages.veryEasyQuestions / count),
    totalAccepted: Math.round(overallAverages.totalAccepted / count),
    totalRejected: Math.round(overallAverages.totalRejected / count),
    kr20: Number((overallAverages.kr20 / count).toFixed(2))
  };

  const total = finalAverages.totalAccepted + finalAverages.totalRejected;
  const percentages = {
    goodQuestions: ((finalAverages.goodQuestions / total) * 100).toFixed(2),
    easyQuestions: ((finalAverages.easyQuestions / total) * 100).toFixed(2),
    difficultQuestions: ((finalAverages.difficultQuestions / total) * 100).toFixed(2),
    veryDifficultQuestions: ((finalAverages.veryDifficultQuestions / total) * 100).toFixed(2),
    poorQuestions: ((finalAverages.poorQuestions / total) * 100).toFixed(2),
    veryEasyQuestions: ((finalAverages.veryEasyQuestions / total) * 100).toFixed(2)
  };

  return `
    <table class="min-w-full border-collapse border border-gray-300">
      <colgroup>
        <col style="width: 30px;">
        <col style="width: 270px;">
        <col span="9" style="width: auto;">
      </colgroup>
      <thead>
        <tr>
          <th colspan="2" style="width: 300px !important;" class="border border-gray-300 bg-yellow-200 p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">${title}</p>
          </th>
          <th colspan="8" class="border border-gray-300 p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">Summary</p>
          </th>
        </tr>
        <tr>
          <th style="width: 30px !important;" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">S.No</p>
          </th>
          <th style="width: 270px !important;" class="border border-gray-300 p-1">
            <p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel ? 'Level' : 'Department'}</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Good Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Easy Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Difficult Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Accepted</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Difficult Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Poor (Bad) Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Very Easy Questions</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Rejected</p>
          </th>
          <th class="border border-gray-300" style="padding: 2px 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p>
          </th>
        </tr>
      </thead>
      <tbody>
        ${summaries.map((summary, index) => `
          <tr>
            <td rowspan="2" style="width: 30px !important;" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1}</p>
            </td>
            <td rowspan="2" style="width: 270px !important;" class="border border-gray-300 p-1">
              <p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel ? `Level ${summary.name}` : summary.name}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.goodQuestions}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.easyQuestions}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.difficultQuestions}</p>
            </td>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.totalAccepted}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.veryDifficultQuestions}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.poorQuestions}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.veryEasyQuestions}</p>
            </td>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.totalRejected}</p>
            </td>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.kr20}</p>
            </td>
          </tr>
          <tr>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.goodQuestions}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.easyQuestions}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.difficultQuestions}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.veryDifficultQuestions}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.poorQuestions}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.percentages.veryEasyQuestions}%</p>
            </td>
          </tr>
        `).join('')}
        
        <!-- Average Row -->
        <tr>
          <td rowspan="2" colspan="2" class="border border-gray-300 p-1 font-bold" style="text-align: left;">
            <p style="margin: 0; margin-bottom: 10px;">Average</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.goodQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.easyQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.difficultQuestions}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.totalAccepted}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.veryDifficultQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.poorQuestions}</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.veryEasyQuestions}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.totalRejected}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${finalAverages.kr20}</p>
          </td>
        </tr>
        <tr>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.goodQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.easyQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.difficultQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.veryDifficultQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.poorQuestions}%</p>
          </td>
          <td class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${percentages.veryEasyQuestions}%</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
} 