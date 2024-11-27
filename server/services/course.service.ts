import { Course } from '@/lib/models';
import { Types } from 'mongoose';

interface CompareParams {
  semister: number;
  yearA: string;
  yearB: string;
  sectionA: string;
  sectionB: string;
  collegeId: string;
}

interface GroupedComparison {
  byLevel: {
    [key: number]: {
      yearA: {
        [section: string]: any[];
      };
      yearB: {
        [section: string]: any[];
      };
    };
  };
  byDepartment: {
    [key: string]: {
      yearA: {
        [section: string]: any[];
      };
      yearB: {
        [section: string]: any[];
      };
    };
  };
}

function calculateLevelTotals(courses: any[]) {
  const totals = {
    yearA: courses.reduce((acc, course) => ({
      accepted: acc.accepted + (course.yearA.accepted || 0),
      rejected: acc.rejected + (course.yearA.rejected || 0),
      kr20: acc.kr20 + (course.yearA.kr20 || 0)
    }), { accepted: 0, rejected: 0, kr20: 0 }),
    yearB: courses.reduce((acc, course) => ({
      accepted: acc.accepted + (course.yearB.accepted || 0),
      rejected: acc.rejected + (course.yearB.rejected || 0),
      kr20: acc.kr20 + (course.yearB.kr20 || 0)
    }), { accepted: 0, rejected: 0, kr20: 0 })
  };

  // Calculate averages
  const courseCount = courses.length;
  return {
    yearA: {
      accepted: Math.round(totals.yearA.accepted / courseCount),
      rejected: Math.round(totals.yearA.rejected / courseCount),
      kr20: totals.yearA.kr20 / courseCount
    },
    yearB: {
      accepted: Math.round(totals.yearB.accepted / courseCount),
      rejected: Math.round(totals.yearB.rejected / courseCount),
      kr20: totals.yearB.kr20 / courseCount
    }
  };
}

function generateComparisonHTML(title: string, courses: any[], yearA: string, yearB: string, sectionA: string, sectionB: string, isLevel: boolean = true) {
  const averages = calculateLevelTotals(courses);
  
  return `
    <table style="margin-top: 15px;" class="min-w-full border-collapse border rounded-md overflow-hidden  border-gray-300">
      <colgroup>
        <col style="width: 40px;">
        <col style="width: 200px;">
        <col span="6" style="width: auto;">
      </colgroup>
      <thead>
        <tr>
          <th colspan="2" style="width: 300px !important;" class="border border-gray-300 bg-yellow-200 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${isLevel ? `LEVEL ${title}` : `DEPARTMENT: ${title}`}</p>
          </th>
          <th colspan="3" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">1st Semester, ${yearA} (${sectionA})</p>
          </th>
          <th colspan="3" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">1st Semester, ${yearB} (${sectionB})</p>
          </th>
        </tr>
        <tr>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">N</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: left; margin: 0; margin-bottom: 10px;">Course Title & Course code</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Accepted Questions</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Rejected Questions</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Accepted Questions</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Total Rejected Questions</p></th>
          <th class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
        </tr>
      </thead>
      <tbody>
        ${courses.map((course, index) => `
          <tr>
            <td rowspan="2" class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1}</p></td>
            <td rowspan="2" class="border border-gray-300 p-1"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${course.courseTitle} (${course.courseCode})</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${course.yearA.accepted}</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${course.yearA.rejected}</p></td>
            <td rowspan="2" class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${course.yearA.kr20 || '-'}</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${course.yearB.accepted}</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${course.yearB.rejected}</p></td>
            <td rowspan="2" class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${course.yearB.kr20 || '-'}</p></td>
          </tr>
          <tr>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((course.yearA.accepted / (course.yearA.accepted + course.yearA.rejected)) * 100).toFixed(2)}%</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((course.yearA.rejected / (course.yearA.accepted + course.yearA.rejected)) * 100).toFixed(2)}%</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((course.yearB.accepted / (course.yearB.accepted + course.yearB.rejected)) * 100).toFixed(2)}%</p></td>
            <td class="border border-gray-300 p-1"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((course.yearB.rejected / (course.yearB.accepted + course.yearB.rejected)) * 100).toFixed(2)}%</p></td>
          </tr>
        `).join('')}
        <tr>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Total</p></td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.yearA.accepted}</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.yearA.rejected}</p></td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.yearA.kr20.toFixed(2)}</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.yearB.accepted}</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.yearB.rejected}</p></td>
          <td rowspan="2" class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${averages.yearB.kr20.toFixed(2)}</p></td>
        </tr>
        <tr>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((averages.yearA.accepted / (averages.yearA.accepted + averages.yearA.rejected)) * 100).toFixed(2)}%</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((averages.yearA.rejected / (averages.yearA.accepted + averages.yearA.rejected)) * 100).toFixed(2)}%</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((averages.yearB.accepted / (averages.yearB.accepted + averages.yearB.rejected)) * 100).toFixed(2)}%</p></td>
          <td class="border border-gray-300 p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${((averages.yearB.rejected / (averages.yearB.accepted + averages.yearB.rejected)) * 100).toFixed(2)}%</p></td>
        </tr>
      </tbody>
    </table>
  `;
}

function processCoursesForComparison(courses: any[], sectionA: string, sectionB: string, yearA: string, yearB: string) {
  const groupedByLevel: { [key: number]: any[] } = {};
  const groupedByDepartment: { [key: string]: any[] } = {};

  courses.forEach(course => {
    // Process for level grouping
    const level = course.level;
    if (!groupedByLevel[level]) {
      groupedByLevel[level] = [];
    }

    // Process for department grouping
    const department = course.department || 'Uncategorized';
    if (!groupedByDepartment[department]) {
      groupedByDepartment[department] = [];
    }

    const yearKey = course.academic_year === yearA ? 'yearA' : 'yearB';
    
    // Calculate questions counts
    let acceptedQuestions = 0;
    let rejectedQuestions = 0;

    if (course.krValues?.groupedItemAnalysisResults) {
      course.krValues.groupedItemAnalysisResults.forEach((group: any) => {
        if (
          group.classification === 'Poor (Bad) Questions' || 
          group.classification === 'Very Difficult Questions' || 
          group.classification === 'Difficult Questions'
        ) {
          acceptedQuestions += (group.questions?.length || 0);
        }
        else if (
          group.classification === 'Good Questions' || 
          group.classification === 'Easy Questions' || 
          group.classification === 'Very Easy Questions'
        ) {
          rejectedQuestions += (group.questions?.length || 0);
        }
      });
    }

    const courseData = {
      accepted: acceptedQuestions,
      rejected: rejectedQuestions,
      kr20: course.krValues?.KR_20 ? Number(course.krValues.KR_20.toFixed(2)) : 0
    };

    // Process for level grouping
    const existingLevelCourse = groupedByLevel[level].find(
      c => c.courseCode === course.course_code
    );

    if (existingLevelCourse) {
      existingLevelCourse[yearKey] = courseData;
    } else {
      groupedByLevel[level].push({
        courseCode: course.course_code,
        courseTitle: course.course_name,
        yearA: yearKey === 'yearA' ? courseData : { accepted: 0, rejected: 0, kr20: 0 },
        yearB: yearKey === 'yearB' ? courseData : { accepted: 0, rejected: 0, kr20: 0 }
      });
    }

    // Process for department grouping
    const existingDeptCourse = groupedByDepartment[department].find(
      c => c.courseCode === course.course_code
    );

    if (existingDeptCourse) {
      existingDeptCourse[yearKey] = courseData;
    } else {
      groupedByDepartment[department].push({
        courseCode: course.course_code,
        courseTitle: course.course_name,
        yearA: yearKey === 'yearA' ? courseData : { accepted: 0, rejected: 0, kr20: 0 },
        yearB: yearKey === 'yearB' ? courseData : { accepted: 0, rejected: 0, kr20: 0 }
      });
    }
  });

  // Sort both groupings
  Object.keys(groupedByLevel).forEach(level => {
    groupedByLevel[Number(level)].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  });

  Object.keys(groupedByDepartment).forEach(dept => {
    groupedByDepartment[dept].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  });

  return { groupedByLevel, groupedByDepartment };
}

export async function compareCourses({
  collegeId,
  semister,
  yearA,
  yearB,
  sectionA,
  sectionB
}: CompareParams) {
  const collegeObjectId = new Types.ObjectId(collegeId);

  const courses = await Course.find({
    collage: collegeObjectId,
    semister: semister,
    section: { $in: [sectionA, sectionB] },
    academic_year: { $in: [yearA, yearB] }
  })
  .populate({
    path: 'krValues',
    select: 'KR_20 groupedItemAnalysisResults'
  })
  .lean();

  const { groupedByLevel, groupedByDepartment } = processCoursesForComparison(
    courses, 
    sectionA, 
    sectionB, 
    yearA, 
    yearB
  );

  // Generate HTML tables for both levels and departments
  const levelTables = Object.entries(groupedByLevel).map(([level, courses]) => {
    return generateComparisonHTML(level, courses, yearA, yearB, sectionA, sectionB, true);
  });

  const departmentTables = Object.entries(groupedByDepartment).map(([dept, courses]) => {
    return generateComparisonHTML(dept, courses, yearA, yearB, sectionA, sectionB, false);
  });

  // Generate summary tables
  const levelSummaryTable = generateSummaryTableHTML('Level Summary', 
    Object.entries(groupedByLevel)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, courses]) => ({
        name: level,
        averages: calculateLevelTotals(courses)
      })),
    true,
    yearA,
    yearB,
    sectionA,
    sectionB
  );

  const departmentSummaryTable = generateSummaryTableHTML('Department Summary',
    Object.entries(groupedByDepartment)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dept, courses]) => ({
        name: dept,
        averages: calculateLevelTotals(courses)
      })),
    false,
    yearA,
    yearB,
    sectionA,
    sectionB
  );

  return {
    tables: [...levelTables, ...departmentTables, levelSummaryTable, departmentSummaryTable],
    styles: `
      <style>
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
          font-size: 7pt !important;
          margin-bottom: 15px !important;
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
          background-color: #ffd700 !important;
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
          font-weight: bold !important;
          background-color: #f8f9fa !important;
        }

        @media print {
          table {
            page-break-inside: avoid;
          }
        }
      </style>
    `
  };
}

function generateSummaryTableHTML(title: string, summaries: any[], isLevel: boolean = true, yearA: string, yearB: string, sectionA: string, sectionB: string) {
  return `
    <table class="min-w-full border-collapse border mt-[5px] rounded-md overflow-hidden border-gray-300">
      <colgroup>
        <col style="width: 30px;">
        <col style="width: 270px;">
        <col span="6" style="width: auto;">
      </colgroup>
      <thead>
        <tr>
          <th colspan="2" class="border border-gray-300 bg-yellow-200 p-1">
            <p style="text-align: center; margin: 0;">${title}</p>
          </th>
          <th colspan="3" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0;">1st Semester, ${yearA} (${sectionA})</p>
          </th>
          <th colspan="3" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0;">1st Semester, ${yearB} (${sectionB})</p>
          </th>
        </tr>
        <tr>
          <th class="border border-gray-300 p-1">S.No</th>
          <th class="border border-gray-300 p-1">${isLevel ? 'Level' : 'Department'}</th>
          <th class="border border-gray-300 p-1">Total Accepted</th>
          <th class="border border-gray-300 p-1">Total Rejected</th>
          <th class="border border-gray-300 p-1">KR20</th>
          <th class="border border-gray-300 p-1">Total Accepted</th>
          <th class="border border-gray-300 p-1">Total Rejected</th>
          <th class="border border-gray-300 p-1">KR20</th>
        </tr>
      </thead>
      <tbody>
        ${summaries.map((summary, index) => `
          <tr>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${index + 1}</p>
            </td>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: left; margin: 0;">${isLevel ? `Level ${summary.name}` : summary.name}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${summary.averages.yearA.accepted}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${summary.averages.yearA.rejected}</p>
            </td>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${summary.averages.yearA.kr20.toFixed(2)}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${summary.averages.yearB.accepted}</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${summary.averages.yearB.rejected}</p>
            </td>
            <td rowspan="2" class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${summary.averages.yearB.kr20.toFixed(2)}</p>
            </td>
          </tr>
          <tr>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${((summary.averages.yearA.accepted / (summary.averages.yearA.accepted + summary.averages.yearA.rejected)) * 100).toFixed(2)}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${((summary.averages.yearA.rejected / (summary.averages.yearA.accepted + summary.averages.yearA.rejected)) * 100).toFixed(2)}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${((summary.averages.yearB.accepted / (summary.averages.yearB.accepted + summary.averages.yearB.rejected)) * 100).toFixed(2)}%</p>
            </td>
            <td class="border border-gray-300 p-1">
              <p style="text-align: center; margin: 0;">${((summary.averages.yearB.rejected / (summary.averages.yearB.accepted + summary.averages.yearB.rejected)) * 100).toFixed(2)}%</p>
            </td>
          </tr>
        `).join('')}
       
        <tr>
          <td rowspan="2" colspan="2" class="border border-gray-300 p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p>
          </td>
          <td class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.yearA.accepted, 0) / summaries.length)}</p>
          </td>
          <td class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.yearA.rejected, 0) / summaries.length)}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${(summaries.reduce((acc, curr) => acc + curr.averages.yearA.kr20, 0) / summaries.length).toFixed(2)}</p>
          </td>
          <td class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.yearB.accepted, 0) / summaries.length)}</p>
          </td>
          <td class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.yearB.rejected, 0) / summaries.length)}</p>
          </td>
          <td rowspan="2" class="border border-gray-300 p-1">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${(summaries.reduce((acc, curr) => acc + curr.averages.yearB.kr20, 0) / summaries.length).toFixed(2)}</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
} 