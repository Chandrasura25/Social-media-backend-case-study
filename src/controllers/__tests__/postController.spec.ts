import { createPost, getAllPosts, getAllPostsByUser, getFeed, likePost, unlikePost, commentOnPost } from './postController';
import { Request, Response } from 'express';
import Post, { PostDocument } from '../models/Post';

jest.mock('../models/Post');
jest.mock('../utils/uploadFile');
jest.mock('../../index', () => ({
  io: {
    emit: jest.fn()
  }
}));

describe('createPost function', () => {
  it('should create a new post successfully', async () => {
    const req: any = {
      user: { userId: 'user123' },
      body: { text: 'Test post', mentionedUsers: [] },
      file: { path: 'media/path' }
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Post created successfully' });
  });

  it('should return unauthorized if user is not authenticated', async () => {
    const req: any = { user: undefined };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createPost(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  // Add more test cases to cover other scenarios
});

describe('getAllPosts function', () => {
  it('should return all posts with likes and comments count', async () => {
    // Mocking data
    const mockPosts: PostDocument[] = [
      { _id: 'post123', text: 'Test post', likes: ['user1', 'user2'], comments: [{ user: 'user3', text: 'Comment 1' }] }
    ];
    Post.find.mockResolvedValue(mockPosts);

    const req: any = {};
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getAllPosts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{
      _id: 'post123',
      text: 'Test post',
      likesCount: 2,
      commentsCount: 1
    }]);
  });
});

describe('getAllPostsByUser function', () => {
  it('should return all posts by a specific user with likes and comments count', async () => {
    // Mocking data
    const mockPosts: PostDocument[] = [
      { _id: 'post123', text: 'Test post', likes: ['user1', 'user2'], comments: [{ user: 'user3', text: 'Comment 1' }] }
    ];
    Post.find.mockResolvedValue(mockPosts);

    const req: any = { params: { userId: 'user123' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getAllPostsByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{
      _id: 'post123',
      text: 'Test post',
      likesCount: 2,
      commentsCount: 1
    }]);
  });
});

describe('getFeed function', () => {
  it('should return user feed with posts', async () => {
    // Mocking data
    const mockPosts: PostDocument[] = [
      { _id: 'post123', text: 'Test post' }
    ];
    Post.find.mockResolvedValue(mockPosts);

    const req: any = { user: { userId: 'user123', following: ['user456'] } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPosts);
  });
});

describe('likePost function', () => {
  it('should like a post successfully', async () => {
    const req: any = { user: { userId: 'user123' }, params: { postId: 'post123' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mocking data
    const mockPost: PostDocument = { _id: 'post123', likes: [] };
    Post.findById.mockResolvedValue(mockPost);

    await likePost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Post liked successfully' });
  });
});

describe('unlikePost function', () => {
  it('should unlike a post successfully', async () => {
    const req: any = { user: { userId: 'user123' }, params: { postId: 'post123' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mocking data
    const mockPost: PostDocument = { _id: 'post123', likes: ['user123'] };
    Post.findById.mockResolvedValue(mockPost);

    await unlikePost(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Post unliked successfully' });
  });
});

describe('commentOnPost function', () => {
  it('should add a comment to a post successfully', async () => {
    const req: any = {
      user: { userId: 'user123' },
      params: { postId: 'post123' },
      body: { text: 'Test comment', mentionedUsers: [] }
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    // Mocking data
    const mockPost: PostDocument = { _id: 'post123', comments: [] };
    Post.findById.mockResolvedValue(mockPost);

    await commentOnPost(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Comment added successfully' });
  });
});
