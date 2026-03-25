import { config } from '../config';
import User, { IUser } from '../model/User';
import { googleOAuthClient } from '../config/auth';
import mongoose from 'mongoose';

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
    user = await User.create({
      googleId: googleData.googleId,
      email: googleData.email,
      name: googleData.name,
    });
  }
  return user;
}
