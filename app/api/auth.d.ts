// types/auth.d.ts

import { JwtPayload } from 'jsonwebtoken';
import { NextApiRequest } from 'next';

// Type for the decoded JWT payload
export interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
  // Add other fields from your JWT as needed
}

// Extend NextApiRequest to include user information
export interface AuthenticatedNextApiRequest extends NextApiRequest {
  userInformation?: DecodedToken;
}
