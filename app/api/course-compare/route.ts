import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { compareCourses } from '@/server/services/course.service';

export async function GET(request: Request) {
  try {
    await connectToMongoDB();

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    const semister = searchParams.get('semister');
    const yearA = searchParams.get('yearA');
    const yearB = searchParams.get('yearB');
    const sectionA = searchParams.get('sectionA');
    const sectionB = searchParams.get('sectionB');

    if (!collegeId || !semister || !yearA || !yearB || !sectionA || !sectionB) {
      return NextResponse.json({
        message: 'Missing required parameters'
      }, { status: 400 });
    }

    const { tables, styles } = await compareCourses({
      collegeId,
      semister: Number(semister),
      yearA,
      yearB,
      sectionA,
      sectionB
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Course Comparison</title>
          ${styles}
          <style>
            body {
              margin: 0;
              padding: 0;
            }
            .tables-container {
              padding: 0;
              margin: 0;
            }
            table {
              margin-bottom: 15px !important;
            }
            table:last-child {
              margin-bottom: 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="tables-container">
            ${tables.join('\n')}
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {    console.error('Course comparison error:', error);
    return NextResponse.json({
      message: 'Error comparing courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 