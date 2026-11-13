import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();
let mongo: MongoMemoryServer;

export function useDatabase() {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
}

let counter = 0;

/** Registers a user and returns their id and an auth header. */
export async function createUser(name?: string) {
  const username = name ?? `user${++counter}`;
  const res = await request(app)
    .post('/api/register')
    .send({ username, email: `${username}@example.com`, password: 'password123' })
    .expect(201);
  return { id: res.body.user.id as string, username, auth: { Authorization: `Bearer ${res.body.token}` } };
}
