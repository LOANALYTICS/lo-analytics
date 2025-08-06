import * as ExcelJS from 'exceljs';

interface CourseAssessmentData {
  course: {
    course_name: string;
    course_code: string;
    level: number;
  };
  assessment: {
    cloData: Array<{
      clo: string;
      description: string;
    }>;
  } | null;
  achievementData: Array<{
    clo: string;
    achievementGrade: number;
    percentageAchieving: number;
  }> | null;
  indirectData: Array<{
    clo: string;
    achievementRate: number;
    benchmark: string;
    achievementPercentage: number;
  }> | null;
}

export async function generateAssessmentReportExcel(
  coursesData: CourseAssessmentData[],
  academic_year: string,
  semester: number,
  section: string
): Promise<Buffer> {
  // Create Excel workbook using ExcelJS
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Assessment Report');

  // Add headers
  worksheet.addRow(['S No', 'Level', 'Course Name & Code', 'CLOs', 'CLO Achievement']);
  worksheet.addRow(['', '', '', '', 'Direct', 'Indirect']);

  // Merge header cells
  worksheet.mergeCells('E1:F1'); // Merge "CLO Achievement" across Direct/Indirect

  // Style headers with yellow background and center alignment
  const headerRow1 = worksheet.getRow(1);
  const headerRow2 = worksheet.getRow(2);

  [headerRow1, headerRow2].forEach(row => {
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' } // Yellow background
      };
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Add data rows
  let currentRow = 3;
  coursesData.forEach((courseData, courseIndex) => {
    if (!courseData.assessment?.cloData || courseData.assessment.cloData.length === 0) {
      // If no CLO data, add one row with empty CLO info
      const row = worksheet.addRow([
        courseIndex + 1,
        courseData.course.level,
        `${courseData.course.course_name} ${courseData.course.course_code}`,
        'No CLO data',
        '',
        ''
      ]);

      // Style the row with center alignment
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      currentRow++;
      return;
    }

    // Sort CLOs for this course
    const sortedCourseClos = courseData.assessment.cloData.sort((a, b) => {
      const aNum = parseInt(a.clo.replace(/[^\d]/g, ''));
      const bNum = parseInt(b.clo.replace(/[^\d]/g, ''));
      return aNum - bNum;
    });

    const startRow = currentRow;

    sortedCourseClos.forEach((cloData, cloIndex) => {
      // Create proper CLO name (CLO 1, CLO 2, etc.)
      const cloNumber = cloIndex + 1;
      const properCloName = `CLO ${cloNumber}`;

      // Find direct achievement
      const directAchievementKey = `clo${cloNumber}`;
      const directAchievement = courseData.achievementData?.find(ach => ach.clo === directAchievementKey);
      const directValue = directAchievement ? `${Math.round(Number(directAchievement.percentageAchieving))}%` : '';

      // Find indirect achievement
      const indirectAchievement = courseData.indirectData?.find(indirect =>
        indirect.clo === properCloName || indirect.clo === `CLO ${cloNumber}`
      );
      const indirectValue = indirectAchievement ? `${Math.round(Number(indirectAchievement.achievementPercentage))}%` : '';

      const row = worksheet.addRow([
        cloIndex === 0 ? courseIndex + 1 : '', // S No only on first CLO row
        cloIndex === 0 ? courseData.course.level : '', // Level only on first CLO row
        cloIndex === 0 ? `${courseData.course.course_name} ${courseData.course.course_code}` : '', // Course name only on first CLO row
        properCloName, // CLO name
        directValue, // Direct achievement
        indirectValue // Indirect achievement
      ]);

      // Style the row with center alignment
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      currentRow++;
    });

    // Merge cells for course info spanning multiple CLO rows
    if (sortedCourseClos.length > 1) {
      const endRow = currentRow - 1;
      worksheet.mergeCells(`A${startRow}:A${endRow}`); // S No
      worksheet.mergeCells(`B${startRow}:B${endRow}`); // Level
      worksheet.mergeCells(`C${startRow}:C${endRow}`); // Course Name & Code
    }
  });

  // Set column widths
  worksheet.columns = [
    { width: 8 },   // S No
    { width: 8 },   // Level
    { width: 30 },  // Course Name & Code
    { width: 12 },  // CLOs
    { width: 12 },  // Direct
    { width: 12 }   // Indirect
  ];

  // Generate Excel buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}