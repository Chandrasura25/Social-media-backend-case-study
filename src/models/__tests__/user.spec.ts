import mongoose from 'mongoose';
import User, { UserDocument } from './User';
const MONGODB_URI = process.env.MONGODB_URI;
describe('User Model', () => {
  beforeAll(async () => {
    // Connect to a test database
     await mongoose.connect(MONGODB_URI!);
  });

  afterAll(async () => {
    // Disconnect Mongoose
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await User.deleteMany({});
  });

  it('should throw validation error if required fields are missing', async () => {
    // Test missing required fields
    const user = new User();
    await expect(user.save()).rejects.toThrow();
  });

  it('should throw validation error if email format is invalid', async () => {
    // Test invalid email format
    const userData = {
      username: 'testuser',
      email: 'invalidemail', // Invalid email format
      password: 'password123',
    };
    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });

  it('should create a new user if all required fields are provided', async () => {
    // Test creating a valid user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const user = new User(userData);
    await expect(user.save()).resolves.toBeTruthy();
  });

  it('should throw validation error if email is not unique', async () => {
    // Test duplicate email
    const userData = {
      username: 'testuser1',
      email: 'test@example.com',
      password: 'password123',
    };
    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData); // Same email as user1
    await expect(user2.save()).rejects.toThrow();
  });

  it('should allow creating a user with a unique email', async () => {
    // Test unique email
    const userData1 = {
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123',
    };
    const user1 = new User(userData1);
    await expect(user1.save()).resolves.toBeTruthy();

    const userData2 = {
      username: 'testuser2',
      email: 'test2@example.com', // Different email
      password: 'password123',
    };
    const user2 = new User(userData2);
    await expect(user2.save()).resolves.toBeTruthy();
  });
});
