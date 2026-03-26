import bcrypt from 'bcryptjs';
import { config } from '../config';
import User, { IUser } from '../model/User';
import { googleOAuthClient } from '../config/auth';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';

export async function verifyGoogleToken(
  credential: string
): Promise<{ googleId: string; email: string; name: string }> {
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: credential,
    audience: config.google.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token payload');
  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name ?? payload.email!,
  };
}

export async function findOrCreateUser(googleData: {
  googleId: string;
  email: string;
  name: string;
}): Promise<mongoose.HydratedDocument<IUser>> {
  let user = await User.findOne({ googleId: googleData.googleId });
  if (!user) {
    user = await User.findOne({ email: googleData.email });
  }

  if (!user) {
    user = await User.create({
      googleId: googleData.googleId,
      email: googleData.email,
      name: googleData.name,
    });
    return user;
  }

  if (!user.googleId) {
    user.googleId = googleData.googleId;
  }
  if (!user.name) {
    user.name = googleData.name;
  }
  await user.save();

  return user;
}

export async function registerLocalUser(data: {
  username: string;
  email: string;
  password: string;
}): Promise<mongoose.HydratedDocument<IUser>> {
  const existingEmailUser = await User.findOne({ email: data.email });
  if (existingEmailUser) {
    throw ApiError.conflict('Email is already in use');
  }

  const existingUsernameUser = await User.findOne({ username: data.username });
  if (existingUsernameUser) {
    throw ApiError.conflict('Username is already in use');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  return User.create({
    username: data.username,
    email: data.email,
    passwordHash,
    name: data.username,
  });
}

export async function loginLocalUser(data: {
  email: string;
  password: string;
}): Promise<mongoose.HydratedDocument<IUser>> {
  const user = await User.findOne({ email: data.email });
  if (!user?.passwordHash) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return user;
}
