import mongoose from 'mongoose';
import { IUser, userSchema } from '@/server/models/user.model';
import { ICollage, collageSchema } from '@/server/models/collage.model';
import { ICourse, courseSchema } from '@/server/models/course.model';
import { IKRValue, krValueSchema } from '@/server/models/kr-value.model';

// Ensure models are registered only once
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Collage = mongoose.models.Collage || mongoose.model<ICollage>('Collage', collageSchema);
export const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);
export const KRValue = mongoose.models.KRValue || mongoose.model<IKRValue>('KRValue', krValueSchema);

// Type-safe model exports
export type UserModel = mongoose.Model<IUser>;
export type CollageModel = mongoose.Model<ICollage>;
export type CourseModel = mongoose.Model<ICourse>;
export type KRValueModel = mongoose.Model<IKRValue>; 