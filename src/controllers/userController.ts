import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { isValidObjectId } from 'mongoose';
import User from '../models/User';
import Notification from '../models/Notification';
import { notify } from '../realtime';
import { AuthenticatedRequest, signJwt } from '../utils/authMiddleware';
import { HttpError } from '../utils/httpError';
import { paged, paginate } from '../utils/pagination';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user: any) {
  return {
    id: String(user._id),
    username: user.username,
    email: user.email,
    followersCount: user.followers?.length ?? 0,
    followingCount: user.following?.length ?? 0,
    createdAt: user.createdAt,
  };
}

export async function register(req: AuthenticatedRequest, res: Response) {
  const { username, email, password } = req.body ?? {};

  if (typeof username !== 'string' || username.trim().length < 3) {
    throw new HttpError(422, 'username must be at least 3 characters');
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    throw new HttpError(422, 'A valid email is required');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(422, 'password must be at least 8 characters');
  }

  const exists = await User.exists({ $or: [{ email: email.toLowerCase() }, { username: username.trim() }] });
  if (exists) {
    throw new HttpError(409, 'Email or username is already taken');
  }

  const user = await User.create({
    username: username.trim(),
    email,
    password: await bcrypt.hash(password, 10),
  });

  res.status(201).json({ token: signJwt(String(user._id)), user: publicUser(user) });
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new HttpError(422, 'email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  // Same response for unknown email and wrong password, so accounts can't be enumerated
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({ token: signJwt(String(user._id)), user: publicUser(user) });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(publicUser(user));
}

export async function getUser(req: AuthenticatedRequest, res: Response) {
  const user = await User.findById(req.params.userId);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(publicUser(user));
}

export async function follow(req: AuthenticatedRequest, res: Response) {
  const me = req.user!.userId;
  const target = req.params.userIdToFollow;

  if (!isValidObjectId(target)) throw new HttpError(400, 'Invalid id');
  if (target === me) throw new HttpError(400, 'You cannot follow yourself');
  if (!(await User.exists({ _id: target }))) throw new HttpError(404, 'User not found');

  // The filter makes this a no-op if already following (modifiedCount is unreliable with timestamps)
  const result = await User.updateOne({ _id: me, following: { $ne: target } }, { $addToSet: { following: target } });
  if (result.matchedCount === 0) {
    throw new HttpError(409, 'You are already following this user');
  }
  await User.updateOne({ _id: target }, { $addToSet: { followers: me } });
  await notify({ recipient: target, actor: me, type: 'follow' });

  res.json({ message: 'You are now following this user' });
}

export async function unfollow(req: AuthenticatedRequest, res: Response) {
  const me = req.user!.userId;
  const target = req.params.userIdToUnfollow;

  if (!isValidObjectId(target)) throw new HttpError(400, 'Invalid id');

  const result = await User.updateOne({ _id: me, following: target }, { $pull: { following: target } });
  if (result.matchedCount === 0) {
    throw new HttpError(409, 'You are not following this user');
  }
  await User.updateOne({ _id: target }, { $pull: { followers: me } });

  res.json({ message: 'You have unfollowed this user' });
}

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
  const { page, limit, skip } = paginate(req);
  const filter: Record<string, unknown> = { recipient: req.user!.userId };
  if (req.query.unread === 'true') filter.read = false;

  const [data, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'username')
      .lean(),
    Notification.countDocuments(filter),
  ]);

  res.json(paged(data, total, page, limit));
}

export async function markNotificationsRead(req: AuthenticatedRequest, res: Response) {
  const result = await Notification.updateMany({ recipient: req.user!.userId, read: false }, { read: true });
  res.json({ message: 'Notifications marked as read', updated: result.modifiedCount });
}
