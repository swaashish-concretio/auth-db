# Refresh Token Authentication Flow Diagram

## 1. Initial Login/Signup Flow
```
┌─────────┐                           ┌─────────┐                    ┌─────────┐
│         │   1. Login/Signup         │         │                    │         │
│ Client  │ ────────────────────────> │ Server  │                    │  Redis  │
│         │   (email, password)       │         │                    │         │
└─────────┘                           └─────────┘                    └─────────┘
                                           │
                                           │ 2. Validate credentials
                                           │    Hash check
                                           ↓
                                      ┌─────────┐
                                      │   DB    │
                                      │ (User)  │
                                      └─────────┘
                                           │
                                           │ 3. User found
                                           ↓
                                      ┌─────────┐
                                      │ Server  │
                                      │         │
                                      │ Generate:│
                                      │ • Access Token (15m)
                                      │ • Refresh Token (7d)
                                      └─────────┘
                                           │
                                           │ 4. Store refresh token
                                           ├─────────────────────────> ┌─────────┐
                                           │   SET refresh_token:1     │  Redis  │
                                           │   EX 604800               │         │
                                           │                           └─────────┘
                                           │
                                           │ 5. Send cookies
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │  Set-Cookie: token=...    │         │
│         │  Set-Cookie: refreshToken=│         │
└─────────┘                           └─────────┘
    │
    │ 6. Store cookies in browser
    ↓
[Authenticated]
```

## 2. Making API Requests with Valid Token
```
┌─────────┐                           ┌─────────┐
│         │   GET /api/auth/profile   │         │
│ Client  │ ────────────────────────> │ Server  │
│         │   Cookie: token=...       │         │
└─────────┘                           └─────────┘
                                           │
                                           │ Verify access token
                                           │ (jwt.verify)
                                           ↓
                                      [Token Valid]
                                           │
                                           │ Return user data
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │   { user: {...} }         │         │
└─────────┘                           └─────────┘
```

## 3. Access Token Expired - Automatic Refresh
```
┌─────────┐                           ┌─────────┐
│         │   GET /api/auth/profile   │         │
│ Client  │ ────────────────────────> │ Server  │
│         │   Cookie: token=EXPIRED   │         │
└─────────┘                           └─────────┘
                                           │
                                           │ Verify access token
                                           ↓
                                      [Token Expired]
                                           │
                                           │ Return 401
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │   401 Unauthorized        │         │
└─────────┘                           └─────────┘
    │
    │ Client detects 401
    │ Automatically calls refresh
    ↓
┌─────────┐                           ┌─────────┐                    ┌─────────┐
│         │  POST /api/auth/refresh   │         │                    │         │
│ Client  │ ────────────────────────> │ Server  │                    │  Redis  │
│         │  Cookie: refreshToken=... │         │                    │         │
└─────────┘                           └─────────┘                    └─────────┘
                                           │
                                           │ 1. Verify refresh token
                                           │    (jwt.verify)
                                           ↓
                                      [Token Valid]
                                           │
                                           │ 2. Get from Redis
                                           ├─────────────────────────> ┌─────────┐
                                           │   GET refresh_token:1     │  Redis  │
                                           │ <───────────────────────  │         │
                                           │   [token value]           └─────────┘
                                           │
                                           │ 3. Compare tokens
                                           ↓
                                      [Tokens Match]
                                           │
                                           │ 4. Generate new access token
                                           ↓
                                      ┌─────────┐
                                      │ Server  │
                                      │ Generate:│
                                      │ • New Access Token (15m)
                                      └─────────┘
                                           │
                                           │ 5. Send new cookie
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │  Set-Cookie: token=NEW    │         │
└─────────┘                           └─────────┘
    │
    │ 6. Retry original request
    │    with new token
    ↓
┌─────────┐                           ┌─────────┐
│         │  GET /api/auth/profile    │         │
│ Client  │ ────────────────────────> │ Server  │
│         │  Cookie: token=NEW        │         │
└─────────┘                           └─────────┘
                                           │
                                           │ Verify new token
                                           ↓
                                      [Token Valid]
                                           │
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │   { user: {...} }         │         │
└─────────┘   SUCCESS!                └─────────┘
```

## 4. Logout Flow
```
┌─────────┐                           ┌─────────┐                    ┌─────────┐
│         │  POST /api/auth/logout    │         │                    │         │
│ Client  │ ────────────────────────> │ Server  │                    │  Redis  │
│         │  Cookie: token=...        │         │                    │         │
│         │  Cookie: refreshToken=... │         │                    │         │
└─────────┘                           └─────────┘                    └─────────┘
                                           │
                                           │ 1. Extract user ID from token
                                           │    (optional verification)
                                           ↓
                                      [Get User ID]
                                           │
                                           │ 2. Delete refresh token
                                           ├─────────────────────────> ┌─────────┐
                                           │   DEL refresh_token:1     │  Redis  │
                                           │ <───────────────────────  │         │
                                           │   OK                      └─────────┘
                                           │
                                           │ 3. Clear cookies
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │  Clear-Cookie: token      │         │
│         │  Clear-Cookie: refreshToken│        │
└─────────┘                           └─────────┘
    │
    │ Cookies deleted
    ↓
[Logged Out]
```

## 5. Refresh Token Invalid/Expired
```
┌─────────┐                           ┌─────────┐                    ┌─────────┐
│         │  POST /api/auth/refresh   │         │                    │         │
│ Client  │ ────────────────────────> │ Server  │                    │  Redis  │
│         │  Cookie: refreshToken=... │         │                    │         │
└─────────┘                           └─────────┘                    └─────────┘
                                           │
                                           │ 1. Verify refresh token
                                           ↓
                                      [Token Expired or Invalid]
                                           │
                                           │     OR
                                           │
                                           │ 2. Get from Redis
                                           ├─────────────────────────> ┌─────────┐
                                           │   GET refresh_token:1     │  Redis  │
                                           │ <───────────────────────  │         │
                                           │   (nil) - doesn't exist   └─────────┘
                                           │
                                           │ 3. Return error
                                           ↓
┌─────────┐                           ┌─────────┐
│ Client  │ <──────────────────────── │ Server  │
│         │  403 Forbidden            │         │
│         │  "Invalid refresh token"  │         │
└─────────┘                           └─────────┘
    │
    │ Redirect to login
    ↓
[Navigate to /login]
```

## Token Lifecycle Timeline
```
Time: 0m          15m              7d
      │            │               │
      ├────────────┼───────────────┼──────────────>
      │            │               │
      ↓            ↓               ↓
   [Login]   [Access Token]  [Refresh Token]
              Expires         Expires
      │            │               │
      │            │               │
      │◄───────────┤               │
      │  Still within              │
      │  refresh token             │
      │  validity - CAN            │
      │  get new access            │
      │  token                     │
      │                            │
      │                            ↓
      X───────────────────────────X
      Cannot refresh - must login again
```

## Component Interaction Map
```
┌────────────────────────────────────────────────────────────────┐
│                         Client Side                            │
│                                                                 │
│  ┌──────────┐      ┌─────────────┐      ┌─────────────┐      │
│  │   UI     │─────>│ api.js      │─────>│fetchWithRefresh│   │
│  │Component │      │ (login,     │      │  (auto       │     │
│  │          │      │  profile)   │      │   refresh)   │     │
│  └──────────┘      └─────────────┘      └─────────────┘      │
│                            │                     │             │
└────────────────────────────┼─────────────────────┼────────────┘
                             │                     │
                        HTTP Request          HTTP Request
                        (with cookies)        (to /refresh)
                             │                     │
┌────────────────────────────┼─────────────────────┼────────────┐
│                         Server Side              │             │
│                            ↓                     ↓             │
│  ┌───────────┐      ┌──────────┐         ┌──────────┐        │
│  │ Middleware│─────>│Controller│────────>│TokenUtils│        │
│  │  (auth)   │      │(login,   │         │          │        │
│  └───────────┘      │ refresh, │         └──────────┘        │
│                     │ logout)  │               │              │
│                     └──────────┘               │              │
│                           │                    │              │
│                           ↓                    ↓              │
│                     ┌──────────┐         ┌──────────┐        │
│                     │  Models  │         │  Redis   │        │
│                     │  (User   │         │  Client  │        │
│                     │   DB)    │         │          │        │
│                     └──────────┘         └──────────┘        │
└────────────────────────────────────────────────────────────────┘
```

## Security Layers
```
Request Flow with Security Checks:

Client Request
    │
    ├─> 1. HTTPS (TLS encryption)
    │
    ├─> 2. CORS Check (origin validation)
    │
    ├─> 3. Cookie Parser (extract tokens)
    │
    ├─> 4. JWT Verify (signature validation)
    │
    ├─> 5. Redis Check (token still valid)
    │
    ├─> 6. Expiry Check (not expired)
    │
    └─> 7. Access Granted / 401 Unauthorized
```

## Data Storage Overview
```
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  users                                             │    │
│  │  - id (serial primary key)                         │    │
│  │  - email (unique)                                  │    │
│  │  - password (hashed)                               │    │
│  │  - name                                            │    │
│  │  - created_at                                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         Redis                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Key: refresh_token:1                              │    │
│  │  Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." │    │
│  │  TTL: 604800 seconds (7 days)                      │    │
│  │                                                     │    │
│  │  Key: refresh_token:2                              │    │
│  │  Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." │    │
│  │  TTL: 604800 seconds (7 days)                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Cookies (httpOnly, secure, sameSite)              │    │
│  │                                                     │    │
│  │  token=eyJhbGciOiJIUzI1NiIsInR5cCI...             │    │
│  │  Max-Age: 900 (15 minutes)                         │    │
│  │                                                     │    │
│  │  refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI...      │    │
│  │  Max-Age: 604800 (7 days)                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```
