import { Redis } from "ioredis";
import type { RedisConfig } from "@/config/redis.config.js";

export const setupRedisClient = async (config: RedisConfig): Promise<Redis> => {
	const redis = new Redis({
		host: config.host,
		port: config.port,
		password: config.password,
		db: config.db,
	});

	await redis.ping();

	return redis;
};
