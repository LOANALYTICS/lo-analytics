// models/Collage.ts

import { Document, Schema } from 'mongoose';

export interface ICollage extends Document {
    _id: string;
    logo: string;
    english: string;
    regional: string;
    university: string;
}

export const collageSchema = new Schema<ICollage>({
    logo: { type: String },
    english: { type: String },
    regional: { type: String },
    university: { type: String }
}, { timestamps: true });
