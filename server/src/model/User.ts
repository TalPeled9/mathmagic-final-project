import mongoose from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  username?: string;
  googleId?: string;
  passwordHash?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true, minlength: 3, maxlength: 50 },
  googleId: { type: String, unique: true, sparse: true },
  passwordHash: { type: String },
  name:     { type: String, required: true, trim: true, maxlength: 100 },
}, { timestamps: true });

const User = mongoose.model<IUser>("User", userSchema);

export default User;