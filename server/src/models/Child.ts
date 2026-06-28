import mongoose, { Schema, Document, Types } from 'mongoose';
import type { GradeLevel } from '@mathmagic/types';

interface IBadge {
  badgeType: string;
  badgeName: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
}

export interface IAvatarSlot {
  imageData: string;
  description: string;
  createdAt: Date;
}

export interface IChildDocument extends Document {
  parentId: Types.ObjectId;
  name: string;
  gradeLevel: GradeLevel;
  avatars: IAvatarSlot[];
  activeAvatarIndex: number;
  generationTimestamps: Date[];
  narratorVoice: string;
  currentLevel: number;
  totalXP: number;
  totalStars: number;
  weeklyLearningMinutes: number;
  weekStart: Date;
  unlockedWorlds: string[];
  badges: IBadge[];
  consecutiveHintFreeAdventures: number;
  createdAt: Date;
  updatedAt: Date;
}

const avatarSlotSchema = new Schema<IAvatarSlot>(
  {
    imageData: { type: String, default: '' },
    description: { type: String, default: '' },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const childSchema = new Schema<IChildDocument>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    gradeLevel: { type: Number, required: true, min: 1, max: 6 },
    avatars: { type: [avatarSlotSchema], default: [] },
    activeAvatarIndex: { type: Number, default: 0, min: 0, max: 3 },
    generationTimestamps: { type: [Date], default: [] },
    narratorVoice: { type: String, default: 'UQ15q3Vf9AQQ2owcMKQ0' },
    currentLevel: { type: Number, default: 1 },
    totalXP: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    weeklyLearningMinutes: { type: Number, default: 0 },
    weekStart: { type: Date, default: () => new Date(0) },
    unlockedWorlds: { type: [String], default: [] },
    consecutiveHintFreeAdventures: { type: Number, default: 0, min: 0 },
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
