import type { Request, Response } from 'express';
import { ApiResponse } from './response.js';

export const healthCheck = (_req: Request, res: Response) => {
  const data = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    memory: {
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
    },
    nodeVersion: process.version,
    platform: process.platform,
  };

  return ApiResponse.ok(res, data, 'System is healthy');
};
