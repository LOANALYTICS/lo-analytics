import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export default function middleware(req: NextRequest) {
  // Try to get the token from cookies
  const token = req.cookies.get('token')?.value;
  console.log('Token from cookie:', token); // Log to check if token exists

  // If there's no token, redirect to the sign-in page
  if (!token) {
    console.log('No token found, redirecting to /sign-in');
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

      // Step 2: Verify the JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
      }

  try {
        // Step 3: Attach user information to headers for access in the route handler
        const userInformation = JSON.stringify(decoded);
        const modifiedRequest:any = req.nextUrl.clone();
        modifiedRequest.headers.set('userInformation', userInformation);
    
        // Step 4: Allow the request to proceed
        return NextResponse.next({ request: modifiedRequest });
    // If verification succeeds, allow the request to proceed
    return NextResponse.next();
  } catch (err: any) {
    console.error('Token verification failed, redirecting to /sign-in:', err.message);
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
}

// Define which paths this middleware should run on, excluding sign-in and sign-up routes
export const config = {
  matcher: ['/dashboard/:path*'], // Protect only the /dashboard route and its subpaths
};
