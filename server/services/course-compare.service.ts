import { Course } from '@/lib/models';
import { Types } from 'mongoose';

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
    accepted: courses.reduce((sum, course) => sum + (course.yearA?.accepted || 0), 0),
    rejected: courses.reduce((sum, course) => sum + (course.yearA?.rejected || 0), 0),
    acceptedB: courses.reduce((sum, course) => sum + (course.yearB?.accepted || 0), 0),
    rejectedB: courses.reduce((sum, course) => sum + (course.yearB?.rejected || 0), 0),
    kr20A: courses.reduce((sum, course) => sum + (course.yearA?.kr20 || 0), 0),
    kr20B: courses.reduce((sum, course) => sum + (course.yearB?.kr20 || 0), 0)
  };

  const count = courses.length || 1;
  const totalA = totals.accepted + totals.rejected;
  const totalB = totals.acceptedB + totals.rejectedB;

  return {
    accepted: Math.round(totals.accepted / count),
    rejected: Math.round(totals.rejected / count),
    acceptedB: Math.round(totals.acceptedB / count),
    rejectedB: Math.round(totals.rejectedB / count),
    acceptedPercentageA: totalA ? ((totals.accepted / totalA) * 100).toFixed(2) : '0',
    rejectedPercentageA: totalA ? ((totals.rejected / totalA) * 100).toFixed(2) : '0',
    acceptedPercentageB: totalB ? ((totals.acceptedB / totalB) * 100).toFixed(2) : '0',
    rejectedPercentageB: totalB ? ((totals.rejectedB / totalB) * 100).toFixed(2) : '0',
    kr20A: Number((totals.kr20A / count).toFixed(2)),
    kr20B: Number((totals.kr20B / count).toFixed(2))
  };
}

function generateTableHTML(title: string, courses: any[], yearA: string, yearB: string, sectionA: string, sectionB: string, isLevel: boolean = true) {
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
            <th colspan="2" style="width: 300px !important; background-color: #f0f0f0;" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 14px;">${title}</p>
            </th>
            <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 14px;">Section ${sectionA}, ${yearA}</p>
            </th>
            <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
              <p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 14px;">Section ${sectionB}, ${yearB}</p>
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
          ${courses.map((course, index) => `
            <tbody class="row-pair">
              <tr>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${index + 1}</p></td>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.courseTitle}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearA?.accepted || '-'}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearA?.rejected || '-'}</p></td>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px; font-weight: bold">${course.yearA?.kr20?.toFixed(2) || '-'}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearB?.accepted || '-'}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearB?.rejected || '-'}</p></td>
                <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px; font-weight: bold">${course.yearB?.kr20?.toFixed(2) || '-'}</p></td>
              </tr>
              <tr>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearA?.acceptedPercentage?.toFixed(2) || '-'}${course.yearA?.acceptedPercentage ? '%' : ''}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearA?.rejectedPercentage?.toFixed(2) || '-'}${course.yearA?.rejectedPercentage ? '%' : ''}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearB?.acceptedPercentage?.toFixed(2) || '-'}${course.yearB?.acceptedPercentage ? '%' : ''}</p></td>
                <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-size: 12px;">${course.yearB?.rejectedPercentage?.toFixed(2) || '-'}${course.yearB?.rejectedPercentage ? '%' : ''}</p></td>
              </tr>
            </tbody>
          `).join('')}
          <tr>
            <td rowspan="2" colspan="2" class="border border-black p-1 font-bold">
              <p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">Average</p>
            </td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.accepted}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.rejected}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.kr20A}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.acceptedB}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.rejectedB}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.kr20B}</p></td>
          </tr>
          <tr>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.acceptedPercentageA}%</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.rejectedPercentageA}%</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.acceptedPercentageB}%</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; font-size: 12px; margin-bottom: 10px;">${averages.rejectedPercentageB}%</p></td>
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

function generateSummaryTableHTML(title: string, summaries: any[], isLevel: boolean = true, yearA: string, yearB: string, sectionA: string, sectionB: string) {
  const totalAcceptedA = summaries.reduce((acc, curr) => acc + (Number(curr.averages.acceptedPercentageA) || 0), 0);
  const totalRejectedA = summaries.reduce((acc, curr) => acc + (Number(curr.averages.rejectedPercentageA) || 0), 0);
  const totalAcceptedB = summaries.reduce((acc, curr) => acc + (Number(curr.averages.acceptedPercentageB) || 0), 0);
  const totalRejectedB = summaries.reduce((acc, curr) => acc + (Number(curr.averages.rejectedPercentageB) || 0), 0);

  const avgAcceptedPercentageA = !isNaN(totalAcceptedA) ? (totalAcceptedA / summaries.length).toFixed(2) : '0';
  const avgRejectedPercentageA = !isNaN(totalRejectedA) ? (totalRejectedA / summaries.length).toFixed(2) : '0';
  const avgAcceptedPercentageB = !isNaN(totalAcceptedB) ? (totalAcceptedB / summaries.length).toFixed(2) : '0';
  const avgRejectedPercentageB = !isNaN(totalRejectedB) ? (totalRejectedB / summaries.length).toFixed(2) : '0';

  return `
    <table class="min-w-full border-collapse border mt-[5px] rounded-md overflow-hidden border-black" style="border-color: #000000 !important;">
      <colgroup>
        <col style="width: 40px;">
        <col style="width: 200px;">
        <col span="6" style="width: auto;">
      </colgroup>
      <thead>
        <tr>
          <th colspan="2" style="width: 300px !important; background-color: #f0f0f0;" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${title}</p>
          </th>
          <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Section ${sectionA}, ${yearA}</p>
          </th>
          <th colspan="3" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">Section ${sectionB}, ${yearB}</p>
          </th>
        </tr>
        <tr>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">N</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${isLevel ? 'Level' : 'Department'}</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Accepted</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Rejected</p></th>
          <th class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">KR20</p></th>
        </tr>
      </thead>
      <tbody>
        ${summaries.map((summary, index) => `
          <tr>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${index + 1}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: left; margin: 0; margin-bottom: 10px;">${summary.name}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.accepted || '-'}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejected || '-'}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold">${summary.averages.kr20A || '-'}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.acceptedB || '-'}</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejectedB || '-'}</p></td>
            <td rowspan="2" class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px; font-weight: bold">${summary.averages.kr20B || '-'}</p></td>
          </tr>
          <tr>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.acceptedPercentageA || '-'}%</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejectedPercentageA || '-'}%</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.acceptedPercentageB || '-'}%</p></td>
            <td class="border border-black p-1" style="border-color: #000000 !important; padding-top: 4px;"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${summary.averages.rejectedPercentageB || '-'}%</p></td>
          </tr>
        `).join('')}
        <tr>
          <td rowspan="2" colspan="2" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">Average</p></td>
          <td class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.accepted, 0) / summaries.length)}</p></td>
          <td class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.rejected, 0) / summaries.length)}</p></td>
          <td rowspan="2" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${(summaries.reduce((acc, curr) => acc + curr.averages.kr20A, 0) / summaries.length).toFixed(2)}</p></td>
          <td class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.acceptedB, 0) / summaries.length)}</p></td>
          <td class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${Math.round(summaries.reduce((acc, curr) => acc + curr.averages.rejectedB, 0) / summaries.length)}</p></td>
          <td rowspan="2" class="border border-black p-1 font-bold"><p style="text-align: center; margin: 0; margin-bottom: 10px;">${(summaries.reduce((acc, curr) => acc + curr.averages.kr20B, 0) / summaries.length).toFixed(2)}</p></td>
        </tr>
        <tr>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgAcceptedPercentageA}%</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgRejectedPercentageA}%</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgAcceptedPercentageB}%</p>
          </td>
          <td class="border border-black p-1 font-bold">
            <p style="text-align: center; margin: 0; margin-bottom: 10px;">${avgRejectedPercentageB}%</p>
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function processCoursesForComparison(courses: any[], sectionA: string, sectionB: string, yearA: string, yearB: string) {
  const groupedByLevel: { [key: number]: any[] } = {};
  const groupedByDepartment: { [key: string]: any[] } = {};

  courses.forEach(course => {
    const level = course.level;
    const department = course.department || 'Uncategorized';

    if (!groupedByLevel[level]) groupedByLevel[level] = [];
    if (!groupedByDepartment[department]) groupedByDepartment[department] = [];

    const krValue = course.krValues;
    
    let accepted = 0;
    let rejected = 0;

    krValue?.groupedItemAnalysisResults?.forEach((group: any) => {
      const questionCount = group.questions?.length || 0;
      
      if (['Good Questions', 'Easy Questions', 'Very Easy Questions'].includes(group.classification)) {
        accepted += questionCount;
      } else if (['Poor (Bad) Questions', 'Very Difficult Questions', 'Difficult Questions'].includes(group.classification)) {
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
      yearB: {}
    };

    if (course.section === sectionA && course.academic_year === yearA) {
      courseData.yearA = {
        accepted,
        rejected,
        kr20: krValue?.KR_20 || 0,
        acceptedPercentage: total ? (accepted / total) * 100 : 0,
        rejectedPercentage: total ? (rejected / total) * 100 : 0
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
        rejectedPercentage: total ? (rejected / total) * 100 : 0
      };
    }

    const existingLevelCourse = groupedByLevel[level].find(c => c.courseCode === course.course_code);
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

    const existingDeptCourse = groupedByDepartment[department].find(c => c.courseCode === course.course_code);
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

  console.log('Processed Data:', {
    levels: groupedByLevel,
    departments: groupedByDepartment
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
}: CourseCompareParams) {
  const collegeObjectId = new Types.ObjectId(collegeId);

  const courses = await Course.find({
    collage: collegeObjectId,
    semister: semister,
    section: { $in: [sectionA, sectionB] },
    academic_year: { $in: [yearA, yearB] }
  })
  .populate('krValues')
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
    .map(([level, courses]) => generateTableHTML(`Level ${level}`, courses, yearA, yearB, sectionA, sectionB, true));

  // Generate individual tables for each department
  const departmentTables = Object.entries(groupedByDepartment)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, courses]) => generateTableHTML(dept, courses, yearA, yearB, sectionA, sectionB, false));

  // Generate ONE summary table for all levels
  const levelSummaryTable = generateSummaryTableHTML('Level Summary',
    Object.entries(groupedByLevel)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, courses]) => ({
        name: `Level ${level}`,
        averages: calculateAverages(courses)
      })),
    true,
    yearA,
    yearB,
    sectionA,
    sectionB
  );

  // Generate ONE summary table for all departments
  const departmentSummaryTable = generateSummaryTableHTML('Department Summary',
    Object.entries(groupedByDepartment)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dept, courses]) => ({
        name: dept,
        averages: calculateAverages(courses)
      })),
    false,
    yearA,
    yearB,
    sectionA,
    sectionB
  );

  return {
    tables: [...levelTables, ...departmentTables,levelSummaryTable, departmentSummaryTable],
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
          background-color: #ffd700 !important;
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
          font-weight: bold !important;
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
    `
  };
} 