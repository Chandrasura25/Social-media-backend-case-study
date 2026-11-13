import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  get mongoUri() {
    return required('MONGODB_URI');
  },
  get jwtSecret() {
    return required('JWT_SECRET');
  },
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  /** Optional. When unset, response caching is skipped. */
  redisUrl: process.env.REDIS_URL,
  /** Optional. When unset, uploaded media is stored on local disk under /uploads. */
  cloudinary: {
    cloudName: process.env.CLOUD_NAME,
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
  },
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS) || 60,
};
