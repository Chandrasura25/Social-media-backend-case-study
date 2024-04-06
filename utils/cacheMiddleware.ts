import { Request, Response, NextFunction } from 'express';
import redis, { RedisClient } from 'redis';

const client: RedisClient = redis.createClient();

// Cache middleware
export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key: string = req.originalUrl; // Use the request URL as the cache key

  client.get(key, (err: Error | null, data: string | null) => {
    if (err) {
      console.error('Error retrieving data from cache:', err);
      next();
      return;
    }

    if (data) {
      console.log('Data retrieved from cache');
      res.status(200).json(JSON.parse(data)); // Serve data from cache
    } else {
      console.log('Data not found in cache');
      const sendResponse = res.send.bind(res); // Bind res.send to the response object
      res.send = (body): Response<any, Record<string, any>> => {
        client.setex(key, 3600, JSON.stringify(body)); // Cache data for 1 hour using setEx
        return sendResponse(body); // Send the response
      };
      next();
    }
  });
};
