import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Console log the received form data
    console.log('Assessment Report Form Data:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Form data received successfully' 
    });
    
  } catch (error) {
    console.error('Error processing assessment report request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    );
  }
}