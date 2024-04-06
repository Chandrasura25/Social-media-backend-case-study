import express from 'express';
import redis from 'redis';

const client = redis.createClient();

// Cache middleware
export const cacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const key = req.originalUrl; // Use the request URL as the cache key

  client.get(key, (err, data) => {
    if (err) {
      console.error('Error retrieving data from cache:', err);
      next();
    }

    if (data) {
      console.log('Data retrieved from cache');
      res.status(200).json(JSON.parse(data)); // Serve data from cache
    } else {
      console.log('Data not found in cache');
      res.sendResponse = res.send;
      res.send = (body) => {
        client.setex(key, 3600, JSON.stringify(body)); // Cache data for 1 hour
        res.sendResponse(body);
      };
      next();
    }
  });
};
