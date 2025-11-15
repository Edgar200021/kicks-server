import { CamelCasePlugin, Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import type { DB } from "@/common/types/db.js";
import type { DatabaseConfig } from "@/config/database.config.js";

export const setupDatabaseClient = async (
	config: DatabaseConfig,
): Promise<Kysely<DB>> => {
	const dialect = new PostgresDialect({
		pool: new Pool({
			database: config.name,
			password: config.password,
			host: config.host,
			user: config.user,
			port: config.port,
			max: config.poolMax,
			min: config.poolMin,
		}),
	});

	const db = new Kysely<DB>({
		dialect,
		plugins: [new CamelCasePlugin()],
	});

	await sql`SELECT 1`.execute(db);

	return db;
};
