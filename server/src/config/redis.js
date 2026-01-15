import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config();

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redis.on("connect", () => console.log("✓ Redis connected"));
redis.on("error", err => console.error("✕ Redis error", err));

const connectRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
};

export { connectRedis };
export default redis;
