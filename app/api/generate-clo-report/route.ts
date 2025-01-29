import { connectToMongoDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
      await connectToMongoDB();
      
      const { searchParams } = new URL(request.url);
      const percentage = searchParams.get('perc');
      const assessmentId = searchParams.get('assessmentId');
      console.log(percentage, assessmentId, "SOoner")
      return new NextResponse('soon');
    }
    catch (error){
      return NextResponse.json({
        message: 'Error generating assessment report',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    

}