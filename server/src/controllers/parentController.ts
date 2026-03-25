import { Request, Response } from 'express';
import User from '../model/User';
import { ApiError } from '../utils/ApiError';

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
