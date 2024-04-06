import express from 'express';
import verifyToken from '../utils/authMiddleware';
const router = express.Router();
const userController = require('../controllers/userController');
const postController = require('../controllers/postController');

// Auth
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);

// Posts
router.post('/posts', verifyToken, postController.createPost);
router.get('/posts', postController.getAllPosts);
router.get('/posts/:userId', verifyToken, postController.getAllPostsByUser);

// Feeds
router.get('/feed', verifyToken, postController.getFeed);

// Followers and Following
router.post('/follow/:userIdToFollow', verifyToken,  userController.followUser); 
router.post('/unfollow/:userIdToUnfollow', verifyToken,  userController.unfollowUser);
module.exports = router;
