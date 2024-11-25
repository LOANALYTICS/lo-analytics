import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { compareYears } from '@/server/services/year-compare.service';

export async function GET(request: Request) {
  try {
    await connectToMongoDB();

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    const semisterA = searchParams.get('semisterA');
    const semisterB = searchParams.get('semisterB');
    const yearA = searchParams.get('yearA');
    const yearB = searchParams.get('yearB');

    if (!collegeId || !semisterA || !semisterB || !yearA || !yearB) {
      return NextResponse.json({
        message: 'Missing required parameters'
      }, { status: 400 });
    }

    const { tables, styles } = await compareYears({
      collegeId,
      semisterA: Number(semisterA),
      semisterB: Number(semisterB),
      yearA,
      yearB
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Year Comparison</title>
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

            @media print {
              .table-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 15px 0 !important;
              }
              div {
                break-inside: avoid !important;
              }
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

  } catch (error) {
    console.error('Year comparison error:', error);
    return NextResponse.json({
      message: 'Error comparing years',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 