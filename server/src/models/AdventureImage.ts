import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdventureImageDocument extends Document {
  adventureId: Types.ObjectId;
  stepIndex: number;
  imageData: string;
  contentType: string;
  imageDescription: string;
  createdAt: Date;
}

const adventureImageSchema = new Schema<IAdventureImageDocument>(
  {
    adventureId: { type: Schema.Types.ObjectId, ref: 'Adventure', required: true },
    stepIndex: { type: Number, required: true, min: 0 },
    imageData: { type: String, required: true },
    contentType: { type: String, required: true, default: 'image/jpeg' },
    imageDescription: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adventureImageSchema.index({ adventureId: 1, stepIndex: 1 }, { unique: true });

export const AdventureImage = mongoose.model<IAdventureImageDocument>(
  'AdventureImage',
  adventureImageSchema,
);
