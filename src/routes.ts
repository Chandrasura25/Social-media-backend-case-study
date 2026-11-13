import { Router } from 'express';
import * as posts from './controllers/postController';
import * as users from './controllers/userController';
import verifyToken from './utils/authMiddleware';
import { cacheResponse, invalidateAfterWrite } from './utils/cache';
import { asyncHandler as h } from './utils/httpError';
import { upload } from './utils/upload';

const router = Router();

// Auth
router.post('/register', h(users.register));
router.post('/login', h(users.login));
router.get('/me', verifyToken, h(users.me));

// Users & follows
router.get('/users/:userId', verifyToken, h(users.getUser));
router.post('/follow/:userIdToFollow', verifyToken, invalidateAfterWrite, h(users.follow));
router.post('/unfollow/:userIdToUnfollow', verifyToken, invalidateAfterWrite, h(users.unfollow));

// Posts
router.get('/posts', verifyToken, cacheResponse({ perUser: true }), h(posts.getAllPosts));
router.post('/posts', verifyToken, upload.single('file'), invalidateAfterWrite, h(posts.createPost));
router.get('/posts/:userId', verifyToken, cacheResponse({ perUser: true }), h(posts.getPostsByUser));
router.delete('/posts/:postId', verifyToken, invalidateAfterWrite, h(posts.deletePost));
router.post('/posts/like/:postId', verifyToken, invalidateAfterWrite, h(posts.likePost));
router.post('/posts/unlike/:postId', verifyToken, invalidateAfterWrite, h(posts.unlikePost));
router.post('/posts/comment/:postId', verifyToken, invalidateAfterWrite, h(posts.commentOnPost));

// Feed
router.get('/feed', verifyToken, cacheResponse({ perUser: true }), h(posts.getFeed));

// Notifications
router.get('/notifications', verifyToken, h(users.listNotifications));
router.post('/notifications/read', verifyToken, h(users.markNotificationsRead));

export default router;
