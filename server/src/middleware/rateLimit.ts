import rateLimit from 'express-rate-limit';

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: {
    error: {
      message: 'Too many requests. Wizzy needs a moment to recharge! ✨',
    },
  },
});
