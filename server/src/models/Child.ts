import mongoose, { Schema, Document, Types } from 'mongoose';
import type { GradeLevel } from '@mathmagic/types';

interface IBadge {
  badgeType: string;
  badgeName: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
}

export interface IChildDocument extends Document {
  parentId: Types.ObjectId;
  name: string;
  gradeLevel: GradeLevel;
  avatarUrl?: string;
  currentLevel: number;
  totalXP: number;
  totalStars: number;
  unlockedWorlds: string[];
  badges: IBadge[];
  createdAt: Date;
  updatedAt: Date;
}

const childSchema = new Schema<IChildDocument>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    gradeLevel: { type: Number, required: true, min: 1, max: 6 },
    avatarUrl: { type: String },
    currentLevel: { type: Number, default: 1 },
    totalXP: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    unlockedWorlds: { type: [String], default: [] },
    badges: {
      type: [
        new Schema(
          {
            badgeType: String,
            badgeName: String,
            description: String,
            iconUrl: String,
            earnedAt: Date,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Child = mongoose.model<IChildDocument>('Child', childSchema);
