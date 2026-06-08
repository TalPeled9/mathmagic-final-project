import { Request, Response } from 'express';
import User from '../model/User';
import { Child } from '../models/Child';
import { TopicProgress } from '../models/TopicProgress';
import { ApiError } from '../utils/ApiError';
import { generateAvatar } from '../services/avatarService';
import { getWeekStart } from '../services/adventureService';
import type { GradeLevel } from '@mathmagic/types';

interface TopicSummary {
  mathTopic: string;
  masteryLevel: number;
  totalChallenges: number;
  correctAnswers: number;
  accuracyPercent: number;
}

const MAX_WEEKLY_GENERATIONS = 3;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getWeeklyGenerationCount(timestamps: Date[]): number {
  const now = Date.now();
  return timestamps.filter((t) => now - t.getTime() < SEVEN_DAYS_MS).length;
}

function getDaysUntilReset(timestamps: Date[]): number {
  const now = Date.now();
  const recent = timestamps.filter((t) => now - t.getTime() < SEVEN_DAYS_MS);
  if (recent.length < MAX_WEEKLY_GENERATIONS) return 0;
  const oldest = Math.min(...recent.map((t) => t.getTime()));
  return Math.ceil((oldest + SEVEN_DAYS_MS - now) / (24 * 60 * 60 * 1000));
}

function toPublicChild(child: InstanceType<typeof Child>, topTopics: TopicSummary[] = []) {
  return {
    _id: child._id,
    parentId: child.parentId,
    name: child.name,
    gradeLevel: child.gradeLevel,
    avatars: child.avatars.map((a) => ({
      imageData: a.imageData,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
    activeAvatarIndex: child.activeAvatarIndex,
    weeklyGenerationsRemaining: Math.max(
      0,
      MAX_WEEKLY_GENERATIONS - getWeeklyGenerationCount(child.generationTimestamps)
    ),
    weeklyGenerationsDaysUntilReset: getDaysUntilReset(child.generationTimestamps),
    currentLevel: child.currentLevel,
    totalXP: child.totalXP,
    totalStars: child.totalStars,
    weeklyLearningMinutes: child.weeklyLearningMinutes,
    unlockedWorlds: child.unlockedWorlds,
    badges: child.badges,
    topTopics,
    createdAt: child.createdAt,
    updatedAt: child.updatedAt,
  };
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.userId).select('-__v');
  if (!user) throw ApiError.notFound('User not found');
  res.json({ id: String(user._id), email: user.email, name: user.name, createdAt: user.createdAt });
}

export async function getChildren(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const currentWeekStart = getWeekStart(new Date());
  await Child.updateMany(
    { parentId, weekStart: { $not: { $gte: currentWeekStart } } },
    { $set: { weeklyLearningMinutes: 0, weekStart: currentWeekStart } }
  );
  const children = await Child.find({ parentId }).sort({ createdAt: 1 });

  const childIds = children.map((c) => c._id);
  const allTopics = await TopicProgress.find({ childId: { $in: childIds } }).lean();

  const topicsByChild = new Map<string, typeof allTopics>();
  for (const t of allTopics) {
    const key = t.childId.toString();
    if (!topicsByChild.has(key)) topicsByChild.set(key, []);
    topicsByChild.get(key)!.push(t);
  }

  const enriched = children.map((child) => {
    const topics = topicsByChild.get(child._id.toString()) ?? [];
    const topTopics: TopicSummary[] = topics
      .sort((a, b) => b.masteryLevel - a.masteryLevel)
      .slice(0, 3)
      .map((t) => ({
        mathTopic: t.mathTopic,
        masteryLevel: t.masteryLevel,
        totalChallenges: t.totalChallenges,
        correctAnswers: t.correctAnswers,
        accuracyPercent:
          t.totalChallenges > 0 ? Math.round((t.correctAnswers / t.totalChallenges) * 100) : 0,
      }));
    return toPublicChild(child, topTopics);
  });

  res.json({ children: enriched });
}

export async function createChild(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const { name, gradeLevel } = req.body as { name: string; gradeLevel: GradeLevel };

  const count = await Child.countDocuments({ parentId });
  if (count >= 10) throw ApiError.badRequest('Maximum of 10 child profiles allowed');

  const child = await Child.create({
    parentId,
    name,
    gradeLevel,
    avatars: [{ imageData: '', description: '', createdAt: new Date() }],
    activeAvatarIndex: 0,
    generationTimestamps: [],
  });

  res.status(201).json({ child: toPublicChild(child) });
}

export async function getChild(req: Request, res: Response): Promise<void> {
  const child = await Child.findOne({ _id: req.params.childId, parentId: req.user!.userId });
  if (!child) throw ApiError.notFound('Child not found');
  const currentWeekStart = getWeekStart(new Date());
  if (!child.weekStart || child.weekStart < currentWeekStart) {
    child.weeklyLearningMinutes = 0;
    child.weekStart = currentWeekStart;
    await child.save();
  }
  res.json({ child: toPublicChild(child) });
}

export async function updateChild(req: Request, res: Response): Promise<void> {
  const { name, gradeLevel } = req.body as { name?: string; gradeLevel?: GradeLevel };
  const child = await Child.findOne({ _id: req.params.childId, parentId: req.user!.userId });
  if (!child) throw ApiError.notFound('Child not found');
  if (name) child.name = name;
  if (gradeLevel) child.gradeLevel = gradeLevel;
  await child.save();
  res.json({ child: toPublicChild(child) });
}

export async function generateChildAvatar(req: Request, res: Response): Promise<void> {
  const { description, replaceIndex } = req.body as {
    description: string;
    replaceIndex?: number;
  };
  const child = await Child.findOne({ _id: req.params.childId, parentId: req.user!.userId });
  if (!child) throw ApiError.notFound('Child not found');

  const weeklyCount = getWeeklyGenerationCount(child.generationTimestamps);
  if (weeklyCount >= MAX_WEEKLY_GENERATIONS) {
    const daysLeft = getDaysUntilReset(child.generationTimestamps);
    throw new ApiError(
      429,
      `Weekly generation limit reached. Try again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
    );
  }

  if (child.avatars.length >= 4 && replaceIndex === undefined) {
    throw ApiError.badRequest('replaceIndex is required when all avatar slots are filled');
  }

  if (replaceIndex !== undefined && replaceIndex === 0) {
    throw ApiError.badRequest('Cannot replace the default avatar slot');
  }

  const slot = await generateAvatar(child.name, child.gradeLevel, description);
  const avatarSlot = { imageData: slot.imageData, description: slot.description, createdAt: new Date() };

  if (child.avatars.length < 4) {
    child.avatars.push(avatarSlot);
    child.activeAvatarIndex = child.avatars.length - 1;
  } else {
    if (replaceIndex! >= child.avatars.length) {
      throw ApiError.badRequest('replaceIndex out of bounds');
    }
    child.avatars[replaceIndex!] = avatarSlot;
    child.activeAvatarIndex = replaceIndex!;
  }

  child.generationTimestamps.push(new Date());
  await child.save();
  res.json({ child: toPublicChild(child) });
}

export async function setActiveAvatar(req: Request, res: Response): Promise<void> {
  const { avatarIndex } = req.body as { avatarIndex: number };
  const child = await Child.findOne({ _id: req.params.childId, parentId: req.user!.userId });
  if (!child) throw ApiError.notFound('Child not found');

  if (avatarIndex < 0 || avatarIndex >= child.avatars.length) {
    throw ApiError.badRequest('Invalid avatarIndex');
  }

  child.activeAvatarIndex = avatarIndex;
  await child.save();
  res.json({ child: toPublicChild(child) });
}
