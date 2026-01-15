import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserById } from '../models/userModel.js';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  deleteRefreshToken,
  verifyRefreshToken,
  getRefreshToken
} from '../utils/tokenUtils.js';

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashedPassword, name);

    // Generate access token (short-lived)
    const accessToken = generateAccessToken({ id: user.id, email: user.email });

    // Generate refresh token (long-lived)
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Store refresh token in Redis (7 days TTL)
    await storeRefreshToken(user.id, refreshToken, 7 * 24 * 60 * 60);

    // Send access token as httpOnly cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate access token (short-lived)
    const accessToken = generateAccessToken({ id: user.id, email: user.email });

    // Generate refresh token (long-lived)
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // Store refresh token in Redis (7 days TTL)
    await storeRefreshToken(user.id, refreshToken, 7 * 24 * 60 * 60);

    // Send access token as httpOnly cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    // Get user ID from token if authenticated
    if (req.user && req.user.id) {
      // Delete refresh token from Redis
      await deleteRefreshToken(req.user.id);
    }

    // Clear both cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not found' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Get stored refresh token from Redis
    const storedToken = await getRefreshToken(decoded.id);

    // Check if token exists in Redis and matches
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email
    });

    // Send new access token as httpOnly cookie
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      message: 'Token refreshed successfully',
      user: {
        id: decoded.id,
        email: decoded.email
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Server error during token refresh' });
  }
};
