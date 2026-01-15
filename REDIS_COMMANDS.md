# Redis Commands Cheat Sheet for Refresh Tokens

## View All Refresh Tokens
```bash
# Connect to Redis
redis-cli

# List all refresh token keys
KEYS refresh_token:*
# Output: 1) "refresh_token:1"
#         2) "refresh_token:2"
```

## View Specific User's Refresh Token
```bash
# Get refresh token for user with ID 1
GET refresh_token:1
# Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Check Token Expiry
```bash
# Check time-to-live (TTL) in seconds
TTL refresh_token:1
# Output: 604800 (if full 7 days remaining)
#         86400 (if 1 day remaining)
#         -2 (if key doesn't exist)
#         -1 (if key exists but has no expiry)

# Check when token will expire (human-readable)
PTTL refresh_token:1  
# Output in milliseconds
```

## Manually Delete Refresh Token
```bash
# Delete refresh token for user ID 1
DEL refresh_token:1
# Output: (integer) 1 (if deleted successfully)
#         (integer) 0 (if key doesn't exist)
```

## Check if Token Exists
```bash
EXISTS refresh_token:1
# Output: (integer) 1 (exists)
#         (integer) 0 (doesn't exist)
```

## View Token Details
```bash
# Get type of value
TYPE refresh_token:1
# Output: string

# Get memory usage
MEMORY USAGE refresh_token:1
# Output: (integer) <bytes>
```

## Count Total Refresh Tokens
```bash
# Count how many users have active refresh tokens
EVAL "return #redis.call('keys', 'refresh_token:*')" 0
# Output: (integer) 5  (if 5 users are logged in)
```

## Clear All Refresh Tokens (DANGER!)
```bash
# Delete all refresh tokens (logs out ALL users)
redis-cli KEYS "refresh_token:*" | xargs redis-cli DEL

# Or in redis-cli:
EVAL "return redis.call('del', unpack(redis.call('keys', 'refresh_token:*')))" 0
```

## Monitor Token Activity in Real-Time
```bash
# See all Redis commands as they happen
MONITOR
# Press Ctrl+C to stop

# You'll see commands like:
# 1674123456.123456 [0 127.0.0.1:54321] "SETEX" "refresh_token:1" "604800" "eyJ..."
# 1674123457.234567 [0 127.0.0.1:54322] "GET" "refresh_token:1"
```

## Set Custom Expiry for Testing
```bash
# Change expiry to 60 seconds (for testing)
EXPIRE refresh_token:1 60

# Remove expiry (make it permanent) - NOT RECOMMENDED
PERSIST refresh_token:1
```

## Inspect Token Pattern
```bash
# Search for tokens with pattern
SCAN 0 MATCH refresh_token:* COUNT 100
# Returns cursor and matching keys
```

## Debugging Commands

### View Raw Token Value
```bash
# Get token and format it
GET refresh_token:1
# Copy the output to jwt.io to decode and inspect claims
```

### Check All Keys in Database
```bash
# See all keys in current database
KEYS *
```

### Get Database Info
```bash
# See Redis database statistics
INFO keyspace
# Shows:
# - db0:keys=5,expires=5  (5 keys, 5 have expiration)
```

### Check Memory Stats
```bash
INFO memory
# Shows Redis memory usage
```

## Common Scenarios

### User Logout - Verify Token Deleted
```bash
# Before logout
EXISTS refresh_token:1
# (integer) 1

# After logout
EXISTS refresh_token:1
# (integer) 0
```

### Force Logout Specific User
```bash
# Manually delete token to force re-login
DEL refresh_token:1
```

### Force Logout All Users
```bash
# Delete all refresh tokens
redis-cli KEYS "refresh_token:*" | xargs redis-cli DEL
```

### Check Active Sessions
```bash
# List all logged-in user IDs
KEYS refresh_token:*
# Extract user IDs from keys
```

### Find Tokens Expiring Soon
```bash
# Check TTL for each token
for key in $(redis-cli KEYS "refresh_token:*"); do
  echo "$key: $(redis-cli TTL $key) seconds"
done
```

## Production Monitoring

### Check If Redis is Running
```bash
redis-cli ping
# Output: PONG
```

### Check Connection
```bash
redis-cli -h localhost -p 6379 ping
```

### View Slow Queries
```bash
SLOWLOG GET 10
# Shows last 10 slow commands
```

### Check Persistence Status
```bash
INFO persistence
# Shows RDB and AOF status
```

## Backup & Restore (If Needed)

### Backup All Tokens
```bash
# Save current state
SAVE
# or background save
BGSAVE
```

### View Last Save Time
```bash
LASTSAVE
# Returns timestamp
```

## Tips for Development

1. **Use Redis Desktop Manager** (GUI tool) for easier visualization
2. **Enable Redis CLI history**: Just use arrow keys for command history
3. **Use `--raw` flag** for readable output:
   ```bash
   redis-cli --raw GET refresh_token:1
   ```

## Quick Test Workflow

```bash
# 1. Login a user (in your app)
# 2. Check Redis
redis-cli
> KEYS refresh_token:*
> GET refresh_token:1
> TTL refresh_token:1

# 3. Logout user (in your app)
# 4. Verify deletion
> EXISTS refresh_token:1
> exit
```

---

**Note**: Replace `refresh_token:1` with the actual user ID you're testing with.

**Warning**: Commands like `KEYS *` and `DEL` with patterns can be slow on large databases. Use with caution in production!
