import { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import Post from '../models/Post';
import User from '../models/User';
import { notify } from '../realtime';
import { AuthenticatedRequest } from '../utils/authMiddleware';
import { HttpError } from '../utils/httpError';
import { paged, paginate } from '../utils/pagination';
import { storeMedia } from '../utils/upload';

/** mentionedUsers may arrive as a JSON array, a repeated form field, or a comma-separated string. */
function parseIds(value: unknown): string[] {
  if (!value) return [];
  let list: unknown[] = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      list = value.split(',');
    }
  }
  return [...new Set(list.map((v) => String(v).trim()).filter(Boolean))];
}

/** Adds counts and whether the current user liked the post; hides the raw likes array. */
function present(post: any, viewerId?: string) {
  const { likes = [], comments = [], ...rest } = post;
  return {
    ...rest,
    likesCount: likes.length,
    commentsCount: comments.length,
    likedByMe: viewerId ? likes.some((id: unknown) => String(id) === viewerId) : false,
    comments,
  };
}

async function listPosts(req: AuthenticatedRequest, res: Response, filter: Record<string, unknown>) {
  const { page, limit, skip } = paginate(req);
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username')
      .populate('comments.user', 'username')
      .lean(),
    Post.countDocuments(filter),
  ]);
  res.json(paged(posts.map((p) => present(p, req.user?.userId)), total, page, limit));
}

export async function createPost(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId;
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!text && !file) {
    throw new HttpError(422, 'A post needs text, a media file, or both');
  }

  const mentionIds = parseIds(req.body?.mentionedUsers);
  if (mentionIds.some((id) => !isValidObjectId(id))) {
    throw new HttpError(422, 'mentionedUsers must be user ids');
  }
  const mentioned = mentionIds.length ? await User.find({ _id: { $in: mentionIds } }).distinct('_id') : [];

  const post = await Post.create({
    user: userId,
    text,
    media: file ? await storeMedia(file) : undefined,
    mentionedUsers: mentioned,
  });

  await Promise.all(
    mentioned.map((id) => notify({ recipient: String(id), actor: userId, type: 'mention', postId: String(post._id) })),
  );

  res.status(201).json(present(post.toObject(), userId));
}

export const getAllPosts = (req: AuthenticatedRequest, res: Response) => listPosts(req, res, {});

export async function getPostsByUser(req: AuthenticatedRequest, res: Response) {
  if (!isValidObjectId(req.params.userId)) throw new HttpError(400, 'Invalid id');
  return listPosts(req, res, { user: req.params.userId });
}

/** Posts from the people you follow, plus your own, newest first. */
export async function getFeed(req: AuthenticatedRequest, res: Response) {
  const me = await User.findById(req.user!.userId).select('following').lean();
  if (!me) throw new HttpError(404, 'User not found');
  return listPosts(req, res, { user: { $in: [...me.following, me._id] } });
}

export async function deletePost(req: AuthenticatedRequest, res: Response) {
  const post = await Post.findById(req.params.postId);
  if (!post) throw new HttpError(404, 'Post not found');
  if (String(post.user) !== req.user!.userId) throw new HttpError(403, 'You can only delete your own posts');
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
}

export async function likePost(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId;
  const post = await Post.findById(req.params.postId).select('user');
  if (!post) throw new HttpError(404, 'Post not found');

  // The filter makes this a no-op if already liked (modifiedCount is unreliable with timestamps)
  const result = await Post.updateOne({ _id: post._id, likes: { $ne: userId } }, { $addToSet: { likes: userId } });
  if (result.matchedCount === 0) throw new HttpError(409, 'You have already liked this post');

  await notify({ recipient: String(post.user), actor: userId, type: 'like', postId: String(post._id) });
  res.json({ message: 'Post liked successfully' });
}

export async function unlikePost(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId;
  if (!(await Post.exists({ _id: req.params.postId }))) throw new HttpError(404, 'Post not found');
  const result = await Post.updateOne({ _id: req.params.postId, likes: userId }, { $pull: { likes: userId } });
  if (result.matchedCount === 0) throw new HttpError(409, 'You have not liked this post');
  res.json({ message: 'Post unliked successfully' });
}

export async function commentOnPost(req: AuthenticatedRequest, res: Response) {
  const userId = req.user!.userId;
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) throw new HttpError(422, 'Comment text is required');

  const post = await Post.findById(req.params.postId);
  if (!post) throw new HttpError(404, 'Post not found');

  post.comments.push({ user: userId, text } as any);
  await post.save();
  const comment = post.comments[post.comments.length - 1];

  const mentionIds = parseIds(req.body?.mentionedUsers).filter((id) => isValidObjectId(id));
  const mentioned = mentionIds.length ? await User.find({ _id: { $in: mentionIds } }).distinct('_id') : [];

  await notify({ recipient: String(post.user), actor: userId, type: 'comment', postId: String(post._id) });
  await Promise.all(
    mentioned.map((id) => notify({ recipient: String(id), actor: userId, type: 'mention', postId: String(post._id) })),
  );

  res.status(201).json(comment);
}
