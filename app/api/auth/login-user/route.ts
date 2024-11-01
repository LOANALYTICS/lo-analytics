import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import UserModel from '@/server/models/user.model';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json(); 

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const { password: _, ...userWithoutPassword } = user.toObject(); 

    // Prepare response and set cookies
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    }, { status: 200 });


    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour expiration
      path: '/',
    });

    // Return response with cookies set
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      message: 'Error logging in',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
