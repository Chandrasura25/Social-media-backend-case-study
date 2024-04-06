import express from 'express';
import verifyToken from '../utils/authMiddleware';
import { cacheMiddleware } from '../utils/cacheMiddleware';
const router = express.Router();
const userController = require('../controllers/userController');
const postController = require('../controllers/postController');

// Auth
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);

// Posts
router.post('/posts', verifyToken, postController.createPost);
router.get('/posts', cacheMiddleware, postController.getAllPosts); // Add caching middleware
router.get('/posts/:userId', verifyToken, postController.getAllPostsByUser); 

// Feeds
router.get('/feed', verifyToken, cacheMiddleware, postController.getFeed); // Add caching middleware

// Followers and Following
router.post('/follow/:userIdToFollow', verifyToken, userController.followUser); 
router.post('/unfollow/:userIdToUnfollow', verifyToken, userController.unfollowUser); 
module.exports = router;
