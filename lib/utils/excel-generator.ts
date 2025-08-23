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
      ploMapping: {
        k: Array<{ [key: string]: boolean }>;
        s: Array<{ [key: string]: boolean }>;
        v: Array<{ [key: string]: boolean }>;
      };
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

  // Helper function to calculate PLO average across all courses
  const calculatePloAverage = (ploType: 'k' | 's' | 'v', ploIndex: number): string => {
    const allValues: number[] = [];

    coursesData.forEach(courseData => {
      if (!courseData.assessment?.cloData) return;

      courseData.assessment.cloData.forEach((cloData, cloIdx) => {
        const ploMapping = cloData.ploMapping?.[ploType]?.[ploIndex];
        if (!ploMapping) return;

        const isChecked = Object.values(ploMapping)[0];
        if (!isChecked) return;

        // Get direct achievement
        const cloNumber = cloIdx + 1;
        const directAchievementKey = `clo${cloNumber}`;
        const directAchievement = courseData.achievementData?.find(ach => ach.clo === directAchievementKey);
        if (directAchievement && !isNaN(Number(directAchievement.percentageAchieving))) {
          allValues.push(Number(directAchievement.percentageAchieving));
        }

        // Get indirect achievement
        const properCloName = `CLO ${cloNumber}`;
        const indirectAchievement = courseData.indirectData?.find(indirect =>
          indirect.clo === properCloName || indirect.clo === `CLO ${cloNumber}`
        );
        if (indirectAchievement && !isNaN(Number(indirectAchievement.achievementPercentage))) {
          allValues.push(Number(indirectAchievement.achievementPercentage));
        }
      });
    });

    if (allValues.length === 0) return '';
    const average = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    return `${average.toFixed(1)}%`;
  };

  // Get PLO headers from first course that has CLO data
  const firstCourse = coursesData.find(c => c.assessment?.cloData && c.assessment.cloData.length > 0);
  const ploHeaders: string[] = [];
  const ploSubHeaders: string[] = [];

  if (firstCourse?.assessment?.cloData?.[0]?.ploMapping) {
    const ploMapping = firstCourse.assessment.cloData[0].ploMapping;

    // Add K PLO headers with averages
    ploMapping.k.forEach((_, index) => {
      const average = calculatePloAverage('k', index);
      const headerText = average ? `K${index + 1} (${average})` : `K${index + 1}`;
      ploHeaders.push(headerText, '');
      ploSubHeaders.push('Direct', 'Indirect');
    });

    // Add S PLO headers with averages
    ploMapping.s.forEach((_, index) => {
      const average = calculatePloAverage('s', index);
      const headerText = average ? `S${index + 1} (${average})` : `S${index + 1}`;
      ploHeaders.push(headerText, '');
      ploSubHeaders.push('Direct', 'Indirect');
    });

    // Add V PLO headers with averages
    ploMapping.v.forEach((_, index) => {
      const average = calculatePloAverage('v', index);
      const headerText = average ? `V${index + 1} (${average})` : `V${index + 1}`;
      ploHeaders.push(headerText, '');
      ploSubHeaders.push('Direct', 'Indirect');
    });
  }

  // Create 4-row header structure to match your Excel format
  const sectionText = section === 'all' ? 'All Sections' : section === 'male' ? 'Male' : 'Female';
  const semesterText = semester === 1 ? 'First Semester' : 'Second Semester';
  const titleText = `(If for semester add the semester like ${semesterText}, ${academic_year} otherwise Academic Year, ${academic_year}, If semester based on gender)`;

  // Row 1: Title spanning all columns
  const totalColumns = 6 + ploHeaders.length;
  const headerRow1 = [titleText, ...Array(totalColumns - 1).fill('')];

  // Row 2: Main section headers
  const headerRow2 = ['S No', 'Level', 'Course Name & Code', 'CLOs', 'CLO Achievement', '', 'PLOs Achievement', ...Array(ploHeaders.length - 1).fill('')];

  // Row 3: PLO headers (K1, K2, S1, S2, etc.) - just plain names, no averages
  const ploHeadersRow3: string[] = [];
  if (firstCourse?.assessment?.cloData?.[0]?.ploMapping) {
    const ploMapping = firstCourse.assessment.cloData[0].ploMapping;

    // Add K PLO headers - just plain names
    ploMapping.k.forEach((_, index) => {
      ploHeadersRow3.push(`K${index + 1}`, '');
    });

    // Add S PLO headers - just plain names
    ploMapping.s.forEach((_, index) => {
      ploHeadersRow3.push(`S${index + 1}`, '');
    });

    // Add V PLO headers - just plain names
    ploMapping.v.forEach((_, index) => {
      ploHeadersRow3.push(`V${index + 1}`, '');
    });
  }

  const headerRow3 = ['', '', '', '', '', '', ...ploHeadersRow3];

  // Row 4: Direct/Indirect subheaders
  const headerRow4 = ['', '', '', '', 'Direct', 'Indirect', ...ploSubHeaders];

  worksheet.addRow(headerRow1);
  worksheet.addRow(headerRow2);
  worksheet.addRow(headerRow3);
  worksheet.addRow(headerRow4);

  // Helper function to convert column number to Excel column letter
  const getColumnLetter = (colNum: number): string => {
    let result = '';
    while (colNum > 0) {
      colNum--;
      result = String.fromCharCode(65 + (colNum % 26)) + result;
      colNum = Math.floor(colNum / 26);
    }
    return result;
  };

  // Merge cells for 4-row header structure

  try {
    // Row 1: Title spanning all columns
    worksheet.mergeCells(`A1:${getColumnLetter(totalColumns)}1`);

    // Row 2: Merge main section headers
    worksheet.mergeCells('A2:A4'); // S No
    worksheet.mergeCells('B2:B4'); // Level
    worksheet.mergeCells('C2:C4'); // Course Name & Code
    worksheet.mergeCells('D2:D4'); // CLOs
    worksheet.mergeCells('E2:F2'); // CLO Achievement

    // PLOs Achievement header spanning all PLO columns
    if (ploHeaders.length > 0) {
      worksheet.mergeCells(`G2:${getColumnLetter(6 + ploHeaders.length)}2`);
    }

    // Row 3: Merge individual PLO headers (K1, K2, etc.) spanning Direct/Indirect
    let currentCol = 7; // Starting after CLO Achievement columns
    if (firstCourse?.assessment?.cloData?.[0]?.ploMapping) {
      const ploMapping = firstCourse.assessment.cloData[0].ploMapping;

      // Merge K PLO headers
      ploMapping.k.forEach(() => {
        const startCol = getColumnLetter(currentCol);
        const endCol = getColumnLetter(currentCol + 1);
        worksheet.mergeCells(`${startCol}3:${endCol}3`);
        currentCol += 2;
      });

      // Merge S PLO headers
      ploMapping.s.forEach(() => {
        const startCol = getColumnLetter(currentCol);
        const endCol = getColumnLetter(currentCol + 1);
        worksheet.mergeCells(`${startCol}3:${endCol}3`);
        currentCol += 2;
      });

      // Merge V PLO headers
      ploMapping.v.forEach(() => {
        const startCol = getColumnLetter(currentCol);
        const endCol = getColumnLetter(currentCol + 1);
        worksheet.mergeCells(`${startCol}3:${endCol}3`);
        currentCol += 2;
      });
    }
  } catch (error) {
    console.warn('Warning: Could not merge header cells:', error);
  }

  // Style all 4 header rows with yellow background and center alignment
  const headerRows = [
    worksheet.getRow(1),
    worksheet.getRow(2),
    worksheet.getRow(3),
    worksheet.getRow(4)
  ];

  headerRows.forEach(row => {
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

  // Helper function to calculate PLO average for a specific course
  const calculateCoursePloAverage = (courseData: CourseAssessmentData, ploType: 'k' | 's' | 'v', ploIndex: number): { direct: number | null, indirect: number | null } => {
    if (!courseData.assessment?.cloData) return { direct: null, indirect: null };

    const directValues: number[] = [];
    const indirectValues: number[] = [];

    courseData.assessment.cloData.forEach((cloData, cloIdx) => {
      const ploMapping = cloData.ploMapping?.[ploType]?.[ploIndex];
      if (!ploMapping) return;

      const isChecked = Object.values(ploMapping)[0];
      if (!isChecked) return;

      // Get direct achievement
      const cloNumber = cloIdx + 1;
      const directAchievementKey = `clo${cloNumber}`;
      const directAchievement = courseData.achievementData?.find(ach => ach.clo === directAchievementKey);
      if (directAchievement && !isNaN(Number(directAchievement.percentageAchieving))) {
        directValues.push(Number(directAchievement.percentageAchieving));
      }

      // Get indirect achievement
      const properCloName = `CLO ${cloNumber}`;
      const indirectAchievement = courseData.indirectData?.find(indirect =>
        indirect.clo === properCloName || indirect.clo === `CLO ${cloNumber}`
      );
      if (indirectAchievement && !isNaN(Number(indirectAchievement.achievementPercentage))) {
        indirectValues.push(Number(indirectAchievement.achievementPercentage));
      }
    });

    const directAvg = directValues.length > 0 ? (directValues.reduce((sum, val) => sum + val, 0) / directValues.length) / 100 : null;
    const indirectAvg = indirectValues.length > 0 ? (indirectValues.reduce((sum, val) => sum + val, 0) / indirectValues.length) / 100 : null;

    return { direct: directAvg, indirect: indirectAvg };
  };

  // Add data rows - separate row for each CLO with course info spanning
  let currentRow = 5; // Starting after 4 header rows
  coursesData.forEach((courseData, courseIndex) => {
    if (!courseData.assessment?.cloData || courseData.assessment.cloData.length === 0) {
      // If no CLO data, add one row with empty CLO info
      const row = worksheet.addRow([
        courseIndex + 1,
        courseData.course.level,
        `${courseData.course.course_name} ${courseData.course.course_code}`,
        'No CLO data',
        '',
        '',
        ...Array(ploHeaders.length).fill('') // Empty PLO columns
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

    // Calculate PLO averages for this course (single values per PLO)
    const coursePloValues: (number | null)[] = [];
    if (firstCourse?.assessment?.cloData?.[0]?.ploMapping) {
      const ploMapping = firstCourse.assessment.cloData[0].ploMapping;

      // K PLOs
      ploMapping.k.forEach((_, ploIndex) => {
        const avg = calculateCoursePloAverage(courseData, 'k', ploIndex);
        coursePloValues.push(avg.direct, avg.indirect);
      });

      // S PLOs
      ploMapping.s.forEach((_, ploIndex) => {
        const avg = calculateCoursePloAverage(courseData, 's', ploIndex);
        coursePloValues.push(avg.direct, avg.indirect);
      });

      // V PLOs
      ploMapping.v.forEach((_, ploIndex) => {
        const avg = calculateCoursePloAverage(courseData, 'v', ploIndex);
        coursePloValues.push(avg.direct, avg.indirect);
      });
    }

    // Add separate row for each CLO
    sortedCourseClos.forEach((cloData, cloIndex) => {
      const cloNumber = cloIndex + 1;
      const properCloName = `CLO ${cloNumber}`;

      // Find direct achievement
      const directAchievementKey = `clo${cloNumber}`;
      const directAchievement = courseData.achievementData?.find(ach => ach.clo === directAchievementKey);
      const directValue = directAchievement ? Number(directAchievement.percentageAchieving) / 100 : null;

      // Find indirect achievement
      const indirectAchievement = courseData.indirectData?.find(indirect =>
        indirect.clo === properCloName || indirect.clo === `CLO ${cloNumber}`
      );
      const indirectValue = indirectAchievement ? Number(indirectAchievement.achievementPercentage) / 100 : null;

      const row = worksheet.addRow([
        cloIndex === 0 ? courseIndex + 1 : '', // S No only on first CLO row
        cloIndex === 0 ? courseData.course.level : '', // Level only on first CLO row
        cloIndex === 0 ? `${courseData.course.course_name} ${courseData.course.course_code}` : '', // Course name only on first CLO row
        properCloName, // CLO name
        directValue, // Direct achievement (as number)
        indirectValue, // Indirect achievement (as number)
        ...(cloIndex === 0 ? coursePloValues : Array(coursePloValues.length).fill('')) // PLO values only on first row
      ]);

      // Format percentage columns as percentages
      if (directValue !== null) {
        const directCell = row.getCell(5); // Direct column
        directCell.numFmt = '0.0%';
      }
      if (indirectValue !== null) {
        const indirectCell = row.getCell(6); // Indirect column
        indirectCell.numFmt = '0.0%';
      }

      // Format PLO columns as percentages (only on first CLO row)
      if (cloIndex === 0) {
        coursePloValues.forEach((value, index) => {
          if (value !== null) {
            const ploCell = row.getCell(7 + index); // PLO columns start at column 7
            ploCell.numFmt = '0.0%';
          }
        });
      }

      // Style the row with center alignment and text wrapping
      row.eachCell((cell) => {
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true // Enable text wrapping for better course name display
        };
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
      try {
        worksheet.mergeCells(`A${startRow}:A${endRow}`); // S No
        worksheet.mergeCells(`B${startRow}:B${endRow}`); // Level
        worksheet.mergeCells(`C${startRow}:C${endRow}`); // Course Name & Code

        // Merge PLO columns for this course
        let colIndex = 7; // Starting after CLO Achievement columns
        for (let i = 0; i < coursePloValues.length; i++) {
          const colLetter = getColumnLetter(colIndex);
          worksheet.mergeCells(`${colLetter}${startRow}:${colLetter}${endRow}`);
          colIndex++;
        }
      } catch (error) {
        console.warn(`Warning: Could not merge cells for course ${courseData.course.course_name}:`, error);
      }
    }
  });

  // Apply borders to all cells in the used range
  const usedRange = worksheet.actualRowCount;
  const usedColumns = totalColumns;

  for (let row = 1; row <= usedRange; row++) {
    for (let col = 1; col <= usedColumns; col++) {
      const cell = worksheet.getCell(row, col);
      if (!cell.border) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
  }

  // Set column widths
  const columnWidths = [
    { width: 8 },   // S No
    { width: 8 },   // Level
    { width: 40 },  // Course Name & Code - increased width for better text wrapping
    { width: 12 },  // CLOs
    { width: 12 },  // Direct
    { width: 12 },  // Indirect
    ...Array(ploHeaders.length).fill({ width: 10 }) // PLO columns
  ];

  worksheet.columns = columnWidths;

  // Generate Excel buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}