import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Call the API route to verify the token
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

  // Set the user information in the response headers instead
  const nextResponse = NextResponse.next();
  nextResponse.headers.set('userInformation', JSON.stringify(decoded));

  return nextResponse;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
