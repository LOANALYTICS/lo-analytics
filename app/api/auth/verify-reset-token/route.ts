import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToMongoDB } from '@/lib/db';
import { User } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json(
        { message: 'Token and email are required', valid: false },
        { status: 400 }
      );
    }

    await connectToMongoDB();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token', valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Token is valid', valid: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { message: 'An error occurred', valid: false },
      { status: 500 }
    );
  }
}
