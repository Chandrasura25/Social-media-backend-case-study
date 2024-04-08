import mongoose from 'mongoose';
import Post, { PostDocument } from './Post'; // Import your Post model
import User from './User'; // Import your User model for reference
const MONGODB_URI = process.env.MONGODB_URI;
describe('Post Model', () => {
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Connect to a test database
     await mongoose.connect(MONGODB_URI!);

    // Create a test user
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      followers: [],
      following: [],
    });
    const savedUser = await user.save();
    userId = savedUser._id;
  });

  afterAll(async () => {
    // Disconnect Mongoose
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Post.deleteMany({});
  });

  it('should throw validation error if required fields are missing', async () => {
    // Test missing required fields
    const post = new Post();
    await expect(post.save()).rejects.toThrow();
  });

  it('should create a new post if all required fields are provided', async () => {
    // Test creating a valid post
    const postData = {
      user: userId, // Valid user ID
      text: 'This is a test post.',
      likes: [],
      comments: [],
      mentionedUsers: [],
      createdAt: new Date(),
    };
    const post = new Post(postData);
    await expect(post.save()).resolves.toBeTruthy();
  });

  it('should throw validation error if user field has invalid reference', async () => {
    // Test invalid user reference
    const postData = {
      user: mongoose.Types.ObjectId(), // Invalid user ID
      text: 'This is a test post.',
      likes: [],
      comments: [],
      mentionedUsers: [],
      createdAt: new Date(),
    };
    const post = new Post(postData);
    await expect(post.save()).rejects.toThrow();
  });

  it('should allow adding valid user IDs to likes array', async () => {
    // Test adding valid user IDs to likes array
    const postData = {
      user: userId,
      text: 'This is a test post.',
      likes: [userId], // Valid user ID in likes array
      comments: [],
      mentionedUsers: [],
      createdAt: new Date(),
    };
    const post = new Post(postData);
    await expect(post.save()).resolves.toBeTruthy();
  });

   it('should add a like to the post', async () => {
    // Create a test post
    const postData = {
      user: userId,
      text: 'Test post',
      likes: [],
      comments: [],
      mentionedUsers: [],
      createdAt: new Date(),
    };
    const createdPost = await Post.create(postData);

    // Add a like to the post
    await Post.findByIdAndUpdate(createdPost._id, { $push: { likes: userId } });

    // Find the post
    const updatedPost = await Post.findById(createdPost._id);
    expect(updatedPost?.likes).toContainEqual(userId);
  });

  it('should add a comment to the post', async () => {
    // Create a test post
    const postData = {
      user: userId,
      text: 'Test post',
      likes: [],
      comments: [],
      mentionedUsers: [],
      createdAt: new Date(),
    };
    const createdPost = await Post.create(postData);

    // Add a comment to the post
    const commentData = {
      user: userId,
      text: 'Test comment',
      createdAt: new Date(),
    };
    await Post.findByIdAndUpdate(createdPost._id, { $push: { comments: commentData } });

    // Find the post
    const updatedPost = await Post.findById(createdPost._id);
    expect(updatedPost?.comments).toHaveLength(1);
    expect(updatedPost?.comments[0].text).toBe('Test comment');
  });

  it('should add a mentioned user to the post', async () => {
    // Create a test post
    const postData = {
      user: userId,
      text: 'Test post',
      likes: [],
      comments: [],
      mentionedUsers: [],
      createdAt: new Date(),
    };
    const createdPost = await Post.create(postData);

    // Add a mentioned user to the post
    const mentionedUserId = mongoose.Types.ObjectId();
    await Post.findByIdAndUpdate(createdPost._id, { $push: { mentionedUsers: mentionedUserId } });

    // Find the post
    const updatedPost = await Post.findById(createdPost._id);
    expect(updatedPost?.mentionedUsers).toContainEqual(mentionedUserId);
  });

});
