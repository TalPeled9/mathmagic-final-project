import mongoose, { Schema, Document, Types } from 'mongoose';

interface IConversationEntry {
  role: 'wizzy' | 'child' | 'system' | 'image';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface ICurrentChallengeSubdoc {
  problemText: string;
  correctAnswer: string;
  options: [string, string, string, string];
  hintLevel: 0 | 1 | 2 | 3;
  attemptsCount: number;
}

export interface IAdventureDocument extends Document {
  childId: Types.ObjectId;
  mathTopic: string;
  storyWorld: string;
  status: 'in-progress' | 'completed';
  currentStepIndex: number;
  totalSteps: number;
  currentChallenge: ICurrentChallengeSubdoc | null;
  conversationHistory: IConversationEntry[];
  lastChoices: string[];
  currentHints: string[]; // hint texts accumulated for the active challenge
  startedAt: Date;
  completedAt?: Date;
  xpEarned: number;
  starsEarned: number;
  // Per-adventure stats for reward calculation at completion
  totalChallenges: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
}

const currentChallengeSchema = new Schema<ICurrentChallengeSubdoc>(
  {
    problemText: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    options: { type: [String], required: true },
    hintLevel: { type: Number, min: 0, max: 3, default: 0 },
    attemptsCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const conversationEntrySchema = new Schema<IConversationEntry>(
  {
    role: { type: String, enum: ['wizzy', 'child', 'system', 'image'], required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const adventureSchema = new Schema<IAdventureDocument>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
    mathTopic: { type: String, required: true },
    storyWorld: { type: String, required: true },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    currentStepIndex: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 6 },
    currentChallenge: { type: currentChallengeSchema, default: null },
    conversationHistory: { type: [conversationEntrySchema], default: [] },
    lastChoices: { type: [String], default: [] },
    currentHints: { type: [String], default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    xpEarned: { type: Number, default: 0 },
    starsEarned: { type: Number, default: 0, min: 0, max: 3 },
    totalChallenges: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

adventureSchema.index({ childId: 1, status: 1 });

export const Adventure = mongoose.model<IAdventureDocument>('Adventure', adventureSchema);
