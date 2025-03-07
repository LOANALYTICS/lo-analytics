import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { IUser } from '@/server/models/user.model';
import { connectToMongoDB } from '@/lib/db';
import { User } from '@/lib/models';

export async function POST(request: Request) {
  try {
    await connectToMongoDB()

    const { email, password, collage } = await request.json(); 

    const user = await User.findOne({ email }).populate('collage');
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Only check college if user is not an admin
    if(user.role !== 'admin') {
      if((user.collage?._id + "") !== collage) {
        return NextResponse.json({ message: 'Invalid collage' }, { status: 401 });
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user.toObject() as IUser & {
      collage?: { _id: string; logo: string; english: string; regional: string; university: string; }
    }; 

    const token = jwt.sign({ 
      _id: userWithoutPassword._id.toString(),
      name: userWithoutPassword.name,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role,
      cid: userWithoutPassword.collage?._id.toString(),
      permissions: userWithoutPassword.permissions,
    }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    }, { status: 200 });

    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    return NextResponse.json({
      message: 'Error logging in',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
