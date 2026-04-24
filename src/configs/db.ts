import mongoose from 'mongoose';
import { env } from './env.js';

class Database {
  private static instance: Database;
  private currentRetry: number = 0;

  private constructor() {
    mongoose.set('strictQuery', true);
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * NOTE: Source of Truth: checks the actual Mongoose connection state.
   * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
   */
  public get isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async connect(): Promise<void> {
    // If already connected, exit early
    if (this.isConnected) return;

    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    try {
      await mongoose.connect(env.MONGO_URI, options);
      this.currentRetry = 0;

      console.info('🚀 MongoDB Connected successfully');

      // Listeners for logs (we don't need to update a variable here anymore)
      mongoose.connection.on('error', (err) =>
        console.error(`❌ MongoDB Error: ${err}`),
      );
      mongoose.connection.on('disconnected', () =>
        console.warn('⚠️ MongoDB disconnected.'),
      );

      process.on('SIGINT', this.gracefulExit).on('SIGTERM', this.gracefulExit);
    } catch (error) {
      this.currentRetry++;

      if (this.currentRetry < env.DB_MAX_RETRIES) {
        console.warn(
          `⚠️ MongoDB connection failed. Retrying (${this.currentRetry}/${env.DB_MAX_RETRIES}) in ${env.DB_RETRY_INTERVAL / 1000}s...`,
        );
        await this.sleep(env.DB_RETRY_INTERVAL);
        return this.connect();
      } else {
        console.error('❌ Max retries reached. Could not connect to MongoDB.');
        process.exit(1);
      }
    }
  }

  private gracefulExit = async () => {
    try {
      await mongoose.connection.close();
      console.info('🛑 MongoDB connection closed cleanly');
      process.exit(0);
    } catch (err) {
      console.error('Error during database shutdown:', err);
      process.exit(1);
    }
  };
}

export const db = Database.getInstance();

// ESM top-level await triggers the connection on import
await db.connect();
