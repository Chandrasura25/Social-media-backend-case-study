import { Request, Response } from 'express';
import Post, { PostDocument } from '../models/Post';
import { uploadMedia } from '../utils/uploadFile';
import upload from '../utils/multerConfig'; 
import { paginate } from '../utils/pagination';
import Notification from '../models/Notification';
import { io } from '../index';

interface AuthenticatedRequest extends Request {
   user?: { userId: string; following: string[] };// Define the user property with userId
}

// Create a new post
exports.createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
 try {
    const { text } = req.body;
    const userId = req.user?.userId; // Access userId from req.user

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' }); 
    } else {
      upload.single('file')(req, res, async (err: any) => { // Use multer middleware directly
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'File upload error' });
        }

        // Use type assertion to inform TypeScript about the existence of the 'file' property
        const media = (req as any).file ? (req as any).file.path : null; // Media URL from file upload

        const post = new Post({
          user: userId,
          text,
          media: media // Media URL from file upload
        });

        await post.save();

        res.status(201).json({ message: 'Post created successfully' });
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all posts
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = paginate(req);

    const posts: PostDocument[] = await Post.find()
      .skip(skip)
      .limit(limit)
      .populate('user', 'username') // Populate the 'user' field with username
      .lean(); // Use lean() to return plain JavaScript objects

    // Map posts to include the number of likes and comments
    const postsWithLikesAndComments = posts.map(post => ({
      ...post,
      likesCount: post.likes.length, // Number of likes
      commentsCount: post.comments.length, // Number of comments
    }));

    res.status(200).json(postsWithLikesAndComments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all posts by a specific user
export const getAllPostsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = paginate(req);

    const posts: PostDocument[] = await Post.find({ user: userId })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username') // Populate the 'user' field with username
      .lean(); // Use lean() to return plain JavaScript objects

    // Map posts to include the number of likes and comments
    const postsWithLikesAndComments = posts.map(post => ({
      ...post,
      likesCount: post.likes.length, // Number of likes
      commentsCount: post.comments.length, // Number of comments
    }));

    res.status(200).json(postsWithLikesAndComments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Feeds
// Get user's feed with pagination
export const getFeed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const { page, limit, skip } = paginate(req);

    // Ensure req.user.following is available before querying
    if (!req.user.following || !Array.isArray(req.user.following)) {
      res.status(400).json({ message: 'User following list is missing or invalid' });
      return;
    }

    // Fetch posts from users the current user follows with pagination
    const posts: PostDocument[] = await Post.find({ user: { $in: req.user.following } })
      .populate('user', 'username')
      .skip(skip)
      .limit(limit);

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like a post
export const likePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId; // Current user ID
    const { postId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const post: PostDocument | null = await Post.findById(postId).lean();

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Check if the user has already liked the post
    if (!post.likes || !post.likes.includes(userId)) {
      // Add the user to the post's likes list
      await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
      res.status(200).json({ message: 'Post liked successfully' });
      return;
    }

    res.status(400).json({ message: 'You have already liked this post' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unlike a Post
export const unlikePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;// Current user ID
    const { postId } = req.params;

    const post: PostDocument | null = await Post.findById(postId).lean();

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Remove the user from the post's likes list
    await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });

    res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Comment on a Post
export const commentOnPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { postId } = req.params;
    const { text } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (!post.comments) {
      post.comments = [];
    }

    const newComment = {
      user: userId,
      text,
      createdAt: new Date() // Provide a default createdAt value
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
