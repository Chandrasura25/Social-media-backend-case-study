process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'set-by-tests';
delete process.env.REDIS_URL;
delete process.env.CLOUD_NAME;
