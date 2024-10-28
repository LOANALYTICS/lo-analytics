import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { UserRole } from './types.model';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole), 
    required: true,
  },
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default UserModel;
