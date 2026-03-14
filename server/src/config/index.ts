import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmagic',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
  gemini: { apiKey: process.env.GEMINI_API_KEY! },
  isProduction: process.env.NODE_ENV === 'production',
} as const;
