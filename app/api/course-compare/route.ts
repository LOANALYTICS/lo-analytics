import { NextResponse } from "next/server";
import { connectToMongoDB } from "@/lib/db";
import { compareCourses } from "@/server/services/course-compare.service";
import { Collage } from "@/lib/models";
import { convertNumberToWord } from "@/lib/utils/number-to-word";

export async function GET(request: Request) {
  try {
    await connectToMongoDB();

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");
    const semister = searchParams.get("semister");
    const yearA = searchParams.get("yearA");
    const yearB = searchParams.get("yearB");
    const sectionA = searchParams.get("sectionA");
    const sectionB = searchParams.get("sectionB");

    if (!collegeId || !semister || !yearA || !yearB || !sectionA || !sectionB) {
      return NextResponse.json(
        {
          message: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    const college = (await Collage.findById(collegeId)
      .lean()
      .exec()) as unknown as {
      logo?: string;
      english: string;
      regional?: string;
      university: string;
    };
    if (!college) {
      return NextResponse.json(
        { message: "College not found" },
        { status: 404 }
      );
    }

    const { tables, styles } = await compareCourses({
      collegeId,
      semister: Number(semister),
      yearA,
      yearB,
      sectionA,
      sectionB,
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
              max-height: 440px;
              width: 100%;
              object-fit: contain;
            }
          
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header">
              ${
                college.logo
                  ? `<img src="${college.logo}" alt="College Logo" class="college-logo"/>`
                  : ""
              }
             
            </div>
            <hr style="margin-bottom: 40px;"/>
            <div class="header-description">
              <h2 style="font-weight:bold;">Courses Comparison Report</h2>
              <hr/>
              <p>${convertNumberToWord(
                Number(semister)
              )} Semester ${yearA}(${
      sectionA.charAt(0).toUpperCase() + sectionA.slice(1).toLowerCase()
    }) vs ${yearB}(${
      sectionB.charAt(0).toUpperCase() + sectionB.slice(1).toLowerCase()
    })</p>
            </div>
          </div>
          <div class="tables-container">
            ${tables.join("\n")}
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Course comparison error:", error);
    return NextResponse.json(
      {
        message: "Error comparing courses",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
