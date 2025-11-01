import { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from './types.model';

export interface IUser extends Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    collage: Schema.Types.ObjectId;
    role: UserRole;
    permissions: string[];
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export const userSchema = new Schema<IUser>({
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
    collage: { type: Schema.Types.ObjectId, ref: 'Collage' },
    role: {
        type: String,
        enum: Object.values(UserRole),
        required: true,
    },
    permissions: { type: [String] },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Password hashing middleware
userSchema.pre<IUser>('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Password comparison method
userSchema.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};
