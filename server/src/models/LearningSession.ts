import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILearningSessionDocument extends Document {
  childId: Types.ObjectId;
  adventureId: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  date: Date;
}

const learningSessionSchema = new Schema<ILearningSessionDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    adventureId: { type: Schema.Types.ObjectId, ref: 'Adventure', required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number },
    date: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
  },
  { timestamps: false }
);

learningSessionSchema.index({ childId: 1, date: -1 });

export const LearningSession = mongoose.model<ILearningSessionDocument>(
  'LearningSession',
  learningSessionSchema
);
