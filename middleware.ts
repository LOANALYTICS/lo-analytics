import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  const response = await fetch(`${req.nextUrl.origin}/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (response.status !== 200) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const { decoded } = await response.json(); 
  const nextResponse = NextResponse.next();
  
  nextResponse.cookies.set('userInformation', JSON.stringify(decoded), {
    httpOnly: true, 
    path: '/', 
  });
  return nextResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/kr-value/download/:id'], 
};
