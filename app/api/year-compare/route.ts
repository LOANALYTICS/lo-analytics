import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import { compareYears } from '@/server/services/year-compare.service';
import { Collage } from '@/lib/models';

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

    const college = await Collage.findById(collegeId).lean().exec() as unknown as {
      logo?: string;
      english: string;
      regional?: string;
      university: string;
    };
    if (!college) {
      return NextResponse.json({ message: 'College not found' }, { status: 404 });
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
              margin-top: 5px !important;
              margin-bottom: 40px !important;
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
            .header-container {
              margin-bottom: 80px;
            }
            .header {
              text-align: center;
              padding: 4px;
              margin-bottom: 10px;
            }
            .header-description {
              max-width: fit-content;
              margin: 0 auto;
            }
            .header-description h2 {
              font-size: 16px;
              text-align: center;

            }
            .header-description hr {
              margin-top: 10px;
            }
            .header-description p {
              font-size: 12px;
              margin-top: -4px;
              text-align: center;
            }
            .college-logo {
              max-width: 200px;
              margin: 0 auto;
              aspect-ratio: 16/9;
            }
            .college-name {
              font-size: 18px;
              font-weight: bold;
            }
            .university-name {
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header">
              ${college.logo ? `<img src="${college.logo}" alt="College Logo" class="college-logo"/>` : ''}
            <div class="college-name">
              ${college.english} | ${college.regional}
            </div>
            <div class="university-name">${college.university}</div>
            </div>
            <hr style="margin-bottom: 40px;"/>
            <div class="header-description">
              <h2>Year Comparison Report</h2>
              <hr/>
              <p>Sem-${semisterA} ${yearA} vs Sem-${semisterB} ${yearB}</p>
            </div>
          </div>
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