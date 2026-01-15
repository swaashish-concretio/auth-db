# Refresh Token Implementation Guide

## Overview
This authentication system now uses **access tokens** and **refresh tokens** for enhanced security:

- **Access Token**: Short-lived (15 minutes) - Used for API requests
- **Refresh Token**: Long-lived (7 days) - Stored in Redis, used to obtain new access tokens

## Architecture

### Token Flow
```
1. User Login/Signup
   ↓
2. Generate Access Token (15m) + Refresh Token (7d)
   ↓
3. Store Refresh Token in Redis
   ↓
4. Send both tokens as httpOnly cookies
   ↓
5. When Access Token expires → Use Refresh Token to get new Access Token
```

### Redis Storage
- **Key Format**: `refresh_token:{userId}`
- **Value**: The refresh token string
- **TTL**: 7 days (604,800 seconds)

## API Endpoints

### 1. Signup - `POST /api/auth/signup`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Cookies Set:**
- `token`: Access token (15 minutes)
- `refreshToken`: Refresh token (7 days)

---

### 2. Login - `POST /api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Cookies Set:**
- `token`: Access token (15 minutes)
- `refreshToken`: Refresh token (7 days)

---

### 3. Refresh Token - `POST /api/auth/refresh` ⭐ NEW
**Purpose**: Get a new access token using the refresh token

**Headers:**
```
Cookie: refreshToken=<refresh_token>
```

**Request:** No body required

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Cookies Updated:**
- `token`: New access token (15 minutes)

**Error Responses:**
- `401`: Refresh token not found
- `403`: Invalid or expired refresh token

---

### 4. Logout - `POST /api/auth/logout`
**Request:** No body required

**Response:**
```json
{
  "message": "Logout successful"
}
```

**Actions:**
- Deletes refresh token from Redis
- Clears both `token` and `refreshToken` cookies

---

### 5. Get Profile - `GET /api/auth/profile`
**Headers:**
```
Cookie: token=<access_token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# JWT Secrets
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret

# Token Expiry
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Redis URL
REDIS_URL=redis://localhost:6379
```

## Client-Side Implementation

### Handling Token Refresh

#### Option 1: Automatic Token Refresh (Recommended)
```javascript
// Set up axios interceptor to handle token refresh
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        await api.post('/auth/refresh');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### Option 2: Manual Token Refresh
```javascript
async function refreshAccessToken() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Refresh failed, please login again');
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}
```

#### Option 3: Periodic Refresh
```javascript
// Refresh token every 10 minutes
setInterval(async () => {
  await fetch('http://localhost:3001/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
}, 10 * 60 * 1000); // 10 minutes
```

## Security Features

1. **httpOnly Cookies**: Tokens stored in httpOnly cookies prevent XSS attacks
2. **Redis Storage**: Refresh tokens stored server-side for validation
3. **Token Verification**: Refresh tokens validated against Redis before issuing new access tokens
4. **Short-lived Access Tokens**: Reduces risk window if access token is compromised
5. **Token Rotation**: New access token issued on each refresh
6. **Secure Logout**: Refresh token deleted from Redis on logout

## Testing

### Test with cURL

**1. Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt
```

**2. Access Protected Route:**
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -b cookies.txt
```

**3. Refresh Token:**
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**4. Logout:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

### Test with Redis CLI

**Check if refresh token is stored:**
```bash
redis-cli
> KEYS refresh_token:*
> GET refresh_token:1
> TTL refresh_token:1
```

## Troubleshooting

### Problem: "Refresh token not found"
- **Cause**: Cookie not being sent
- **Solution**: Ensure `credentials: 'include'` in fetch/axios

### Problem: "Invalid or expired refresh token"
- **Cause**: Token expired or was deleted from Redis
- **Solution**: User needs to login again

### Problem: Redis connection error
- **Cause**: Redis server not running
- **Solution**: Start Redis server: `redis-server`

## Best Practices

1. **Always use HTTPS in production** to prevent token interception
2. **Set appropriate CORS settings** with credentials support
3. **Monitor Redis memory usage** for token storage
4. **Implement token rotation** for additional security
5. **Use environment-specific secrets** (different for dev/prod)
6. **Log security events** (failed refresh attempts, etc.)

## Migration from Old System

If you're upgrading from the old single-token system:

1. **Database**: No changes needed
2. **Client Code**: Update to handle token refresh (see client examples above)
3. **Environment**: Add new environment variables
4. **Redis**: Ensure Redis is running and connected

## Future Enhancements

Consider implementing:
- [ ] Token rotation on refresh (generate new refresh token too)
- [ ] Device tracking (multiple refresh tokens per user)
- [ ] Suspicious activity detection
- [ ] Token blacklisting for compromised tokens
- [ ] Rate limiting on refresh endpoint
