import { NextResponse } from 'next/server';
import { analyzeSemester } from '@/server/services/semester-analysis.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');

    if (!collegeId || !semester || !year) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const analysis = await analyzeSemester({
      collegeId,
      semester: parseInt(semester),
      academicYear: year
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Semester Analysis</title>
          ${analysis.styles}
        </head>
        <body>
          <div class="tables-container">
            ${analysis.tables.join('\n')}
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse('Error generating analysis', { status: 500 });
  }
} 