import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const redisClient = createClient(); // Create the Redis client

redisClient.connect().then(() => {
  console.log('Redis client connected');
}).catch((error) => {
  console.error('Redis client connection error:', error);
});

// Cache middleware
export const cacheMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const key: string = req.originalUrl; // Use the request URL as the cache key

    const cachedData = await redisClient.get(key);

    if (cachedData) {
      console.log('Data retrieved from cache');
      res.status(200).json(JSON.parse(cachedData)); // Serve data from cache
      return;
    }

    console.log('Data not found in cache');
    await next(); // Proceed to downstream middleware or route handler

    const body = res.locals.resBody; // Access the response body after processing

    if (body) { // Only cache if there's a response body
      await redisClient.setEx(key, 3600, JSON.stringify(body)); // Cache data for 1 hour
    }
  } catch (error) {
    console.error('Error in cache middleware:', error);
    next(error); // Handle errors gracefully
  }
};
