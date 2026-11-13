import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './src/app';
import { config } from './src/config';
import { attachRealtime } from './src/realtime';
import { connectCache } from './src/utils/cache';

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  await connectCache();

  const server = http.createServer(createApp());
  attachRealtime(server);

  server.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
