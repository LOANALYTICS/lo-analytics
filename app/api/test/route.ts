// app/api/protectedRoute/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Access `userInformation` from headers set by the middleware
  const userInformation = request.headers.get('userInformation');
  if (!userInformation) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Parse userInformation and respond
  const { userId, role } = JSON.parse(userInformation);
  return NextResponse.json({
    message: 'Protected content',
    userId,
    role,
  }, { status: 200 });
}
