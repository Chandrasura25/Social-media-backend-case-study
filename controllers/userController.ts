import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';

interface AuthenticatedRequest extends Request {
  user?: { userId: string }; // Define the user property with userId
}

exports.createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user: UserDocument | null = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check password
    const isPasswordValid: boolean = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid password' });
      return;
    }

    // Generate JWT token
    const token: string = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || '', {
      expiresIn: '1h', // Token expires in 1 hour
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Follow a user
export const followUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId; // Access userId from req.user
    const { userIdToFollow } = req.params;

    const currentUser: UserDocument | null = await User.findById(userId);
    const userToFollow: UserDocument | null = await User.findById(userIdToFollow);

    if (!currentUser || !userToFollow) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if the current user is already following the user to follow
    if (currentUser.following.includes(userIdToFollow)) {
      res.status(400).json({ message: 'You are already following this user' });
      return;
    }

    // Add the user to follow to the current user's following list
    if (userId) {
      currentUser.following.push(userIdToFollow);
      await currentUser.save();
    }

    // Add the current user to the user to follow's followers list
    if (userId) {
      userToFollow.followers.push(userId);
      await userToFollow.save();
    }

    res.status(200).json({ message: 'You are now following this user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfollow a user
export const unfollowUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId; // Access userId from req.user
    const { userIdToUnfollow } = req.params;

    const currentUser: UserDocument | null = await User.findById(userId);

    if (!currentUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove the user to unfollow from the current user's following list
    if (userId) {
      currentUser.following = currentUser.following.filter(id => id !== userIdToUnfollow);
      await currentUser.save();
    }

    // Remove the current user from the user to unfollow's followers list
    const userToUnfollow: UserDocument | null = await User.findById(userIdToUnfollow);
    if (userToUnfollow) {
      userToUnfollow.followers = userToUnfollow.followers.filter(id => id !== userId);
      await userToUnfollow.save();
    }

    res.status(200).json({ message: 'You have unfollowed this user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

