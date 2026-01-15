import express from 'express';
import { signup, login, getProfile, logout, refreshToken } from '../controllers/authController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', optionalAuthenticateToken, logout);
router.post('/refresh', refreshToken);
router.get('/profile', authenticateToken, getProfile);

export default router;
