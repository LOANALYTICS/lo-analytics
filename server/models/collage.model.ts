// models/Collage.ts

import { Document, Schema, model, models } from 'mongoose';

export interface ICollage extends Document {
    _id: string;
    logo: string;
    english: string;
    regional: string;
    university: string;
}

// Define the schema
const CollageSchema = new Schema<ICollage>({
    logo: { type: String },
    english: { type: String },
    regional: { type: String },
    university: { type: String }
});

// Use existing model if already compiled, otherwise create a new one
export default models.Collage || model<ICollage>('Collage', CollageSchema);
