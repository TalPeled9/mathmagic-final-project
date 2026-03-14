import 'dotenv/config';
import app from './app';
import { config } from './config/index';
import { connectDB } from './config/database';

connectDB()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
