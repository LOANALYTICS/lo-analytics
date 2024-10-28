import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import UserModel, { IUser } from '@/server/models/user.model';

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json() as IUser;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const user = new UserModel({ name, email, password, role });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    const { password: _, ...userWithoutPassword } = user.toObject(); 

    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword, token }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error); 
    return NextResponse.json({ message: 'Error registering user', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
