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

export const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: {
      message: 'Too many report emails requested. Please try again in a bit.',
    },
  },
});
