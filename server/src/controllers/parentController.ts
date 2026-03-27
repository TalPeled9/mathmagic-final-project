import { Request, Response } from 'express';
import User from '../model/User';
import { Child } from '../models/Child';
import { ApiError } from '../utils/ApiError';
import { generateAvatar } from '../services/avatarService';
import type { GradeLevel } from '@mathmagic/types';

// ----- helpers -----

function toPublicChild(child: InstanceType<typeof Child>) {
  return {
    _id: child._id,
    parentId: child.parentId,
    name: child.name,
    gradeLevel: child.gradeLevel,
    avatarUrl: child.avatarUrl,
    currentLevel: child.currentLevel,
    totalXP: child.totalXP,
    totalStars: child.totalStars,
    unlockedWorlds: child.unlockedWorlds,
    badges: child.badges,
    createdAt: child.createdAt,
    updatedAt: child.updatedAt,
  };
}

// ----- parent profile -----

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.userId).select('-__v');
  if (!user) throw ApiError.notFound('User not found');

  res.json({
    id: String(user._id),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  });
}

// ----- children CRUD -----

// GET /api/parent/children
export async function getChildren(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const children = await Child.find({ parentId }).sort({ createdAt: 1 });
  res.json({ children: children.map(toPublicChild) });
}

// POST /api/parent/children
export async function createChild(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const { name, gradeLevel, avatarDescription } = req.body as {
    name: string;
    gradeLevel: GradeLevel;
    avatarDescription?: string;
  };

  const count = await Child.countDocuments({ parentId });
  if (count >= 10) throw ApiError.badRequest('Maximum of 10 child profiles allowed');

  const avatarUrl = await generateAvatar(name, gradeLevel, avatarDescription);
  const child = await Child.create({ parentId, name, gradeLevel, avatarUrl });

  res.status(201).json({ child: toPublicChild(child) });
}

// GET /api/parent/children/:childId
export async function getChild(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const child = await Child.findOne({ _id: req.params.childId, parentId });
  if (!child) throw ApiError.notFound('Child not found');
  res.json({ child: toPublicChild(child) });
}

// PUT /api/parent/children/:childId
export async function updateChild(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const { name, gradeLevel } = req.body as { name?: string; gradeLevel?: GradeLevel };

  const child = await Child.findOne({ _id: req.params.childId, parentId });
  if (!child) throw ApiError.notFound('Child not found');

  if (name) child.name = name;
  if (gradeLevel) child.gradeLevel = gradeLevel;
  await child.save();

  res.json({ child: toPublicChild(child) });
}

// POST /api/parent/children/:childId/avatar
export async function regenerateAvatar(req: Request, res: Response): Promise<void> {
  const parentId = req.user!.userId;
  const child = await Child.findOne({ _id: req.params.childId, parentId });
  if (!child) throw ApiError.notFound('Child not found');

  child.avatarUrl = await generateAvatar(child.name, child.gradeLevel);
  await child.save();

  res.json({ child: toPublicChild(child) });
}
