import * as XLSX from 'xlsx';

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

export function generateAssessmentReportExcel(
  coursesData: CourseAssessmentData[],
  academic_year: string,
  semester: number,
  section: string
): Buffer {
  // Create Excel workbook
  const workbook = XLSX.utils.book_new();
  
  // Create the data array
  const excelData: any[][] = [];
  
  // Header rows
  excelData.push(['S No', 'Level', 'Course Name & Code', 'CLOs', 'CLO Achievement']);
  excelData.push(['', '', '', '', 'Direct', 'Indirect']);
  
  // Data rows - each course gets multiple rows (one per CLO)
  coursesData.forEach((courseData, courseIndex) => {
    if (!courseData.assessment?.cloData || courseData.assessment.cloData.length === 0) {
      // If no CLO data, add one row with empty CLO info
      excelData.push([
        courseIndex + 1,
        courseData.course.level,
        `${courseData.course.course_name} ${courseData.course.course_code}`,
        'No CLO data',
        '',
        ''
      ]);
      return;
    }

    // Sort CLOs for this course
    const sortedCourseClos = courseData.assessment.cloData.sort((a, b) => {
      const aNum = parseInt(a.clo.replace(/[^\d]/g, ''));
      const bNum = parseInt(b.clo.replace(/[^\d]/g, ''));
      return aNum - bNum;
    });

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

      excelData.push([
        cloIndex === 0 ? (courseIndex + 1).toString() : '', // S No only on first CLO row
        cloIndex === 0 ? courseData.course.level.toString() : '', // Level only on first CLO row
        cloIndex === 0 ? `${courseData.course.course_name} ${courseData.course.course_code}` : '', // Course name only on first CLO row
        properCloName, // CLO name
        directValue, // Direct achievement
        indirectValue // Indirect achievement
      ]);
    });
  });

  // Create worksheet from array
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { width: 8 },   // S No
    { width: 8 },   // Level
    { width: 30 },  // Course Name & Code
    { width: 12 },  // CLOs
    { width: 12 },  // Direct
    { width: 12 }   // Indirect
  ];

  // Apply basic styling
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Style all cells
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }
      
      const isHeader = R <= 1;
      
      worksheet[cellAddress].s = {
        fill: isHeader ? { fgColor: { rgb: "FFFF00" } } : undefined,
        font: {
          bold: isHeader,
          sz: isHeader ? 12 : 10
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        }
      };
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assessment Report');

  // Generate Excel buffer
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    cellStyles: true
  }) as Buffer;
}