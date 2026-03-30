import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITopicProgressDocument extends Document {
  childId: Types.ObjectId;
  mathTopic: string;
  totalChallenges: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
  masteryLevel: number;
  lastPracticedAt?: Date;
}

const topicProgressSchema = new Schema<ITopicProgressDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    mathTopic: { type: String, required: true },
    totalChallenges: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    masteryLevel: { type: Number, default: 0, min: 0, max: 100 },
    lastPracticedAt: { type: Date },
  },
  { timestamps: true }
);

topicProgressSchema.index({ childId: 1, mathTopic: 1 }, { unique: true });

export const TopicProgress = mongoose.model<ITopicProgressDocument>(
  'TopicProgress',
  topicProgressSchema
);
