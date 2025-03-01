import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import courseTemplateModel from "@/server/models/courseTemplate.model";
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Read the Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Get data rows (skip header rows)
    const data = jsonData.slice(2).map((row: unknown) => {
      return {
        course_code: (row as any[])[0]?.toString().trim(),
        course_name: (row as any[])[1]?.toString().trim(),
        credit_hours: (row as any[])[2]?.toString().trim(),
        level: parseInt((row as any[])[3]?.toString()) || 0,
        sem: (row as any[])[4]?.toString().includes("First") ? 1 : 2,
        department: (row as any[])[5]?.toString().trim(),
        // Default values for required fields
        university_name: "Default University",
        coordinator: [],
        academic_year: new Date(),
        students_withdrawn: 0,
        student_absent: 0
      };
    });

    // Create course templates in bulk
    const createdCourses = await courseTemplateModel.insertMany(data);

    return NextResponse.json({ 
      message: "Courses created successfully", 
      count: createdCourses.length 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Failed to process file" }, 
      { status: 500 }
    );
  }
} 