import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';

/**
 * Generate access token
 * @param {Object} payload - User data to encode in token
 * @returns {string} Access token
 */
export const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );
};

/**
 * Generate refresh token
 * @param {Object} payload - User data to encode in token
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
};

/**
 * Store refresh token in Redis
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to store
 * @param {number} expiryInSeconds - Token expiry time in seconds
 */
export const storeRefreshToken = async (userId, refreshToken, expiryInSeconds = 7 * 24 * 60 * 60) => {
    try {
        const key = `refresh_token:${userId}`;
        await redis.setEx(key, expiryInSeconds, refreshToken);
    } catch (error) {
        console.error('Error storing refresh token in Redis:', error);
        throw error;
    }
};

/**
 * Get refresh token from Redis
 * @param {string} userId - User ID
 * @returns {string|null} Refresh token or null
 */
export const getRefreshToken = async (userId) => {
    try {
        const key = `refresh_token:${userId}`;
        return await redis.get(key);
    } catch (error) {
        console.error('Error getting refresh token from Redis:', error);
        throw error;
    }
};

/**
 * Delete refresh token from Redis
 * @param {string} userId - User ID
 */
export const deleteRefreshToken = async (userId) => {
    try {
        const key = `refresh_token:${userId}`;
        await redis.del(key);
    } catch (error) {
        console.error('Error deleting refresh token from Redis:', error);
        throw error;
    }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Verify access token
 * @param {string} token - Access token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};
