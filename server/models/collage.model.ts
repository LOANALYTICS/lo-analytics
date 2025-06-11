// models/Collage.ts

import { Document, Schema } from 'mongoose';

export interface IDepartment {
    _id: string;
    name: string;
    shortName: string;
}

export interface ICollage extends Document {
    _id: string;
    logo: string;
    english: string;
    regional: string;
    university: string;
    departments: IDepartment[];
    toolAccess: string[];
}

export const collageSchema = new Schema<ICollage>({
    logo: { type: String },
    english: { type: String },
    regional: { type: String },
    university: { type: String },
    departments: [{ 
        name: { type: String, required: true },
        shortName: { type: String, required: true }
    }],
    toolAccess: [{ type: String }]
}, { timestamps: true });
