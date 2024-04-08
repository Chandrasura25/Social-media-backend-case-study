// Import necessary modules and functions
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';
import { createUser, loginUser, followUser, unfollowUser } from './userController';

// Mock User model methods
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

// Mock bcrypt methods
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jwt sign method
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mock request and response objects
const reqMock = jest.fn<Partial<AuthenticatedRequest>, []>(() => ({
  body: {},
  params: {},
  user: { userId: '123456' },
}));
const resMock = jest.fn<Partial<Response>, []>(() => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
}));

describe('createUser', () => {
  it('should create a new user successfully', async () => {
    // Mock request body
    const reqBody = { username: 'testuser', email: 'test@example.com', password: 'password123' };
    const req: Request = { body: reqBody } as Request;
    
    // Mock User.findOne to return null, indicating user doesn't exist
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Mock bcrypt hash method to return hashed password
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

    // Mock User.save method to return resolved promise
    (User.prototype.save as jest.Mock).mockResolvedValue();

    // Mock response status and json methods
    const res: Response = resMock();

    // Call createUser function
    await createUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully' });
  });

  it('should return 400 if user already exists', async () => {
    // Mock request body
    const reqBody = { username: 'existinguser', email: 'existing@example.com', password: 'password123' };
    const req: Request = { body: reqBody } as Request;

    // Mock User.findOne to return a user, indicating user already exists
    const existingUser: UserDocument = { username: 'existinguser', email: 'existing@example.com', password: 'hashedPassword123' } as UserDocument;
    (User.findOne as jest.Mock).mockResolvedValue(existingUser);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call createUser function
    await createUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
  });

  it('should return 500 if server error occurs', async () => {
    // Mock request body
    const reqBody = { username: 'testuser', email: 'test@example.com', password: 'password123' };
    const req: Request = { body: reqBody } as Request;

    // Mock User.findOne to throw an error
    (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock response status and json methods
    const res: Response = resMock();

    // Call createUser function
    await createUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
  });
});

describe('loginUser', () => {
  it('should log in a user with valid credentials', async () => {
    // Mock request body
    const reqBody = { email: 'test@example.com', password: 'password123' };
    const req: Request = { body: reqBody } as Request;

    // Mock User.findOne to return a user with the provided email
    const userMock: UserDocument = { email: 'test@example.com', password: 'hashedPassword123', _id: '123456' } as UserDocument;
    (User.findOne as jest.Mock).mockResolvedValue(userMock);

    // Mock bcrypt compare method to return true
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Mock jwt sign method to return a token
    (jwt.sign as jest.Mock).mockReturnValue('token123');

    // Mock response status and json methods
    const res: Response = resMock();

    // Call loginUser function
    await loginUser(req, res);

    // Verify response status and token
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'token123' });
  });

  it('should return 404 if user does not exist', async () => {
    // Mock request body
    const reqBody = { email: 'nonexistent@example.com', password: 'password123' };
    const req: Request = { body: reqBody } as Request;

    // Mock User.findOne to return null, indicating user does not exist
    (User.findOne as jest.Mock).mockResolvedValue(null);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call loginUser function
    await loginUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should return 401 if password is invalid', async () => {
    // Mock request body
    const reqBody = { email: 'test@example.com', password: 'invalidPassword' };
    const req: Request = { body: reqBody } as Request;

    // Mock User.findOne to return a user with the provided email
    const userMock: UserDocument = { email: 'test@example.com', password: 'hashedPassword123', _id: '123456' } as UserDocument;
    (User.findOne as jest.Mock).mockResolvedValue(userMock);

    // Mock bcrypt compare method to return false
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call loginUser function
    await loginUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid password' });
  });
});

describe('followUser', () => {
  it('should successfully follow a user', async () => {
    // Mock AuthenticatedRequest object with userId
    const req: AuthenticatedRequest = { user: { userId: '123456' }, params: { userIdToFollow: '789012' } } as AuthenticatedRequest;

    // Mock currentUser and userToFollow
    const currentUser: UserDocument = { _id: '123456', following: [] } as UserDocument;
    const userToFollow: UserDocument = { _id: '789012', followers: [] } as UserDocument;
    
    // Mock User.findById to return currentUser and userToFollow
    (User.findById as jest.Mock).mockResolvedValueOnce(currentUser).mockResolvedValueOnce(userToFollow);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call followUser function
    await followUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'You are now following this user' });
  });

  it('should return 404 if user to follow not found', async () => {
    // Mock AuthenticatedRequest object with userId
    const req: AuthenticatedRequest = { user: { userId: '123456' }, params: { userIdToFollow: '789012' } } as AuthenticatedRequest;

    // Mock currentUser
    const currentUser: UserDocument = { _id: '123456', following: [] } as UserDocument;
    
    // Mock User.findById to return currentUser and null for userToFollow
    (User.findById as jest.Mock).mockResolvedValueOnce(currentUser).mockResolvedValueOnce(null);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call followUser function
    await followUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should return 400 if already following user', async () => {
    // Mock AuthenticatedRequest object with userId
    const req: AuthenticatedRequest = { user: { userId: '123456' }, params: { userIdToFollow: '789012' } } as AuthenticatedRequest;

    // Mock currentUser and userToFollow
    const currentUser: UserDocument = { _id: '123456', following: ['789012'] } as UserDocument;
    const userToFollow: UserDocument = { _id: '789012', followers: [] } as UserDocument;
    
    // Mock User.findById to return currentUser and userToFollow
    (User.findById as jest.Mock).mockResolvedValueOnce(currentUser).mockResolvedValueOnce(userToFollow);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call followUser function
    await followUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'You are already following this user' });
  });
});

describe('unfollowUser', () => {
  it('should successfully unfollow a user', async () => {
    // Mock AuthenticatedRequest object with userId
    const req: AuthenticatedRequest = { user: { userId: '123456' }, params: { userIdToUnfollow: '789012' } } as AuthenticatedRequest;

    // Mock currentUser and userToUnfollow
    const currentUser: UserDocument = { _id: '123456', following: ['789012'] } as UserDocument;
    const userToUnfollow: UserDocument = { _id: '789012', followers: ['123456'] } as UserDocument;

    // Mock User.findById to return currentUser and userToUnfollow
    (User.findById as jest.Mock).mockResolvedValueOnce(currentUser).mockResolvedValueOnce(userToUnfollow);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call unfollowUser function
    await unfollowUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'You have unfollowed this user' });
  });

  it('should return 404 if user not found', async () => {
    // Mock AuthenticatedRequest object with userId
    const req: AuthenticatedRequest = { user: { userId: '123456' }, params: { userIdToUnfollow: '789012' } } as AuthenticatedRequest;

    // Mock currentUser
    const currentUser: UserDocument = { _id: '123456', following: [] } as UserDocument;

    // Mock User.findById to return currentUser and null for userToUnfollow
    (User.findById as jest.Mock).mockResolvedValueOnce(currentUser).mockResolvedValueOnce(null);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call unfollowUser function
    await unfollowUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should successfully unfollow a user and remove from followers list', async () => {
    // Mock AuthenticatedRequest object with userId
    const req: AuthenticatedRequest = { user: { userId: '123456' }, params: { userIdToUnfollow: '789012' } } as AuthenticatedRequest;

    // Mock currentUser and userToUnfollow
    const currentUser: UserDocument = { _id: '123456', following: ['789012'] } as UserDocument;
    const userToUnfollow: UserDocument = { _id: '789012', followers: ['123456'] } as UserDocument;

    // Mock User.findById to return currentUser and userToUnfollow
    (User.findById as jest.Mock).mockResolvedValueOnce(currentUser).mockResolvedValueOnce(userToUnfollow);

    // Mock response status and json methods
    const res: Response = resMock();

    // Call unfollowUser function
    await unfollowUser(req, res);

    // Verify response status and message
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'You have unfollowed this user' });

    // Verify currentUser's following list is empty
    expect(currentUser.following).toHaveLength(0);

    // Verify userToUnfollow's followers list doesn't contain currentUser's id
    expect(userToUnfollow.followers).not.toContain('123456');
  });
});
