import mongoose from 'mongoose';
import { env } from './env.js';

class Database {
  private static instance: Database;
  private currentRetry: number = 0;

  private constructor() {
    // Set global Mongoose configuration
    mongoose.set('strictQuery', true);

    // Attach process listeners once during instantiation
    process.on('SIGINT', () => this.gracefulExit('SIGINT'));
    process.on('SIGTERM', () => this.gracefulExit('SIGTERM'));
  }

  // Singleton accessor
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Source of Truth: Direct check of the Mongoose connection state.
  public get isReady(): boolean {
    return mongoose.connection.readyState === 1;
  }

  // Internal helper for retry delays
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Initiates the connection with internal retry logic and self-contained config.
  public async connect(): Promise<void> {
    // Prevent overlapping connection attempts or re-connections if already live
    if (this.isReady) return;

    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    try {
      await mongoose.connect(env.MONGO_URI, options);
      this.currentRetry = 0; // Reset on success

      console.info('🚀 MongoDB Connected successfully');

      // Socket-level event listeners for runtime monitoring
      mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB Runtime Error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn(
          '⚠️ MongoDB connection lost. Logic in models will wait for reconnect.',
        );
      });
    } catch (error: unknown) {
      this.currentRetry++;

      // Type-safe error message extraction
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (this.currentRetry < env.DB_MAX_RETRIES) {
        console.warn(
          `⚠️ MongoDB connection failed: ${errorMessage}. ` +
            `Retrying (${this.currentRetry}/${env.DB_MAX_RETRIES}) in ${env.DB_RETRY_INTERVAL / 1000}s...`,
        );

        await this.sleep(env.DB_RETRY_INTERVAL);
        return this.connect(); // Recursive retry
      } else {
        console.error('❌ Max connection retries reached. Critical failure.');
        console.error(`Final Error: ${errorMessage}`);
        process.exit(1);
      }
    }
  }

  // Handles cleaning up the connection pool before the process exits.
  private gracefulExit = async (signal: string) => {
    try {
      await mongoose.connection.close();
      console.info(`🛑 MongoDB closed via ${signal}. Clean exit.`);
      process.exit(0);
    } catch (err) {
      console.error(`❌ Error during ${signal} shutdown:`, err);
      process.exit(1);
    }
  };
}

// Export the singleton instance
export const db = Database.getInstance();

/**
 * SELF-INVOCATION (ESM Top-Level Await)
 * This guarantees the database is ready before the rest of the app
 * (index.ts/app.ts) finishes loading its imports.
 */
await db.connect();
