import { z } from 'zod';

export const googleAuthSchema = z.object({ credential: z.string().min(1, 'Google credential is required') });

export const registerSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(50, 'Username must be at most 50 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
	email: z.email('Email is required').transform((value) => value.toLowerCase()),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
	email: z.email('Email is required').transform((value) => value.toLowerCase()),
	password: z.string().min(1, 'Password is required'),
});