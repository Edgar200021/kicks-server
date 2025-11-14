import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import type { DatabaseConfig } from "@/config/database.config.js";
import type { DB } from "@/types/db.js";

export const setupDatabase = async (
	config: DatabaseConfig,
): Promise<Kysely<DB>> => {
	const dialect = new PostgresDialect({
		pool: new Pool({
			database: config.name,
			host: config.host,
			user: config.user,
			port: config.port,
			max: config.poolMax,
			min: config.poolMin,
		}),
	});

	const db = new Kysely<DB>({
		dialect,
	});

	await sql`SELECT 1`.execute(db);

	return db;
};
