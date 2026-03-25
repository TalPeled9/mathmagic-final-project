import mongoose from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  googleId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  googleId: { type: String, required: true, unique: true, sparse: true },
  name:     { type: String, required: true, trim: true, maxlength: 100 },
}, { timestamps: true });

const User = mongoose.model<IUser>("User", userSchema);

export default User;