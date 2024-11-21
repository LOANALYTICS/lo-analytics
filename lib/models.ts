import mongoose from 'mongoose';
import { IUser, userSchema } from '@/server/models/user.model';
import { ICollage, collageSchema } from '@/server/models/collage.model';

// Ensure models are registered only once
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const Collage = mongoose.models.Collage || mongoose.model<ICollage>('Collage', collageSchema);

// Type-safe model exports
export type UserModel = mongoose.Model<IUser>;
export type CollageModel = mongoose.Model<ICollage>; 