import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.RESEND_FROM_EMAIL = 'MathMagic Reports <test@example.com>';
