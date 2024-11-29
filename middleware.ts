import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
  console.log('Middleware executed for:', req.nextUrl.pathname); // Log the path

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

  const { decoded } = await response.json(); // Get the decoded user information
  const nextResponse = NextResponse.next();
  
  // Set the user information in a cookie instead of a header
  nextResponse.cookies.set('userInformation', JSON.stringify(decoded), {
    httpOnly: true, // Optional: make it httpOnly for security
    path: '/', // Set the path for the cookie
  });

  // Log the userInformation being set
  console.log('Set userInformation cookie:', decoded);

  return nextResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/kr-value/download/:id'], // Ensure this includes your route
};
