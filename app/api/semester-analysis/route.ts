import { NextResponse } from 'next/server';
import { analyzeSemester } from '@/server/services/semester-analysis.service';
import { Collage } from '@/lib/models';
import { connectToMongoDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await connectToMongoDB();
    
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');

    if (!collegeId || !semester || !year) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const college = await Collage.findById(collegeId).lean().exec() as unknown as {
      logo?: string;
      english: string;
      regional?: string;
      university: string;
    };
    if (!college) {
      return new NextResponse('College not found', { status: 404 });
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
          <style>
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
               max-height: 440px;
              width: 100%;
              object-fit: contain;
            }
         
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header">
              ${college.logo ? `<img src="${college.logo}" alt="College Logo" class="college-logo"/>` : ''}
             
            </div>
            <hr style="margin-bottom: 40px;"/>
            <div class="header-description">
              <h2>Semester Analysis Report</h2>
              <hr/>
              <p>Sem-${semester} ${year}</p>
            </div>
          </div>
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