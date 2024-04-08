import mongoose from 'mongoose';
import NotificationModel, { NotificationDocument } from './Notification'; // Import your Notification model
import UserModel from './User'; // Import your User model for reference
import PostModel from './Post'; // Import your Post model for reference

describe('Notification Model', () => {
  let userId: mongoose.Types.ObjectId;
  let postId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect('mongodb://localhost:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test user
    const user = new UserModel({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      followers: [],
      following: [],
    });
    const savedUser = await user.save();
    userId = savedUser._id;

    // Create a test post with comments
    const post = new PostModel({
      user: userId,
      text: 'Test post',
      likes: [],
      comments: [
        {
          user: userId,
          text: 'Test comment 1',
          createdAt: new Date(),
        },
        {
          user: userId,
          text: 'Test comment 2',
          createdAt: new Date(),
        },
      ],
      mentionedUsers: [],
      createdAt: new Date(),
    });
    const savedPost = await post.save();
    postId = savedPost._id;
  });

  afterAll(async () => {
    // Disconnect Mongoose
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await NotificationModel.deleteMany({});
  });

  it('should create a notification for a new comment', async () => {
    // Create a notification for a new comment on the post
    const notificationData = {
      recipient: userId,
      type: 'comment',
      postId,
      read: false,
      createdAt: new Date(),
    };
    const notification = new NotificationModel(notificationData);
    await notification.save();

    // Find the notification
    const savedNotification = await NotificationModel.findOne({ recipient: userId });
    expect(savedNotification).toBeTruthy();
    expect(savedNotification?.type).toBe('comment');
  });

  it('should find notifications for a user', async () => {
    // Create multiple notifications
    const notificationData1 = {
      recipient: userId,
      type: 'like',
      postId,
      read: false,
      createdAt: new Date(),
    };
    const notificationData2 = {
      recipient: userId,
      type: 'mention',
      postId,
      read: false,
      createdAt: new Date(),
    };
    await NotificationModel.create([notificationData1, notificationData2]);

    // Find notifications for the user
    const notifications = await NotificationModel.find({ recipient: userId });
    expect(notifications).toHaveLength(2);
  });

  // Add more test cases as needed
});
