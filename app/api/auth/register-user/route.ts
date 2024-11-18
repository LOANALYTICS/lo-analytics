import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import UserModel, { IUser } from '@/server/models/user.model';

export async function POST(request: Request) {
  try {
    const { name, email, password, collage } = await request.json() as IUser;
    if(password.length > 40) {
      return NextResponse.json({ message: 'Password cant be more then 40 characters' }, { status: 400 });  
    }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const user = new UserModel({ name, email, password, role: 'course_coordinator', collage });
    await user.save();
    await user.populate({
      path: 'collage',
      select: '_id logo english regional university'
    });

    const { password: _, ...userWithoutPassword } = user.toObject() as IUser & {
      collage: { _id: string; logo: string; english: string; regional: string; university: string; }
    }; 
    const token = jwt.sign({ 
      _id: userWithoutPassword._id.toString(),
      name: userWithoutPassword.name,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role,
      cid: userWithoutPassword.collage._id.toString(),
    }, process.env.JWT_SECRET!, { expiresIn: '1h' });


    const response = NextResponse.json({
      message: 'User registered successfully',
      data: user,
      token,
    }, { status: 201 });

    // Set `clg_id` if available and `token` in cookies
    // if (clg_id) {
    //   response.cookies.set('clg_id', clg_id, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     maxAge: 60 * 60 * 24 * 30, // 30 days expiration for example
    //     path: '/',
    //   });
    // }

    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'development',
      // maxAge: 60 * 60, // 1 hour expiration
      // path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      message: 'Error registering user',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
