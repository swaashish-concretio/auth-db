import express from 'express';
import { signup, login, getProfile, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
