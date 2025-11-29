import { type Kysely, sql } from "kysely";

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createType("product_gender")
		.asEnum(["men", "women", "unisex"])
		.execute();

	await db.schema
		.createTable("product")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`),
		)
		.addColumn("title", sql`varchar(100)`, (col) => col.notNull())
		.addColumn("description", "text", (col) => col.notNull())
		.addColumn("is_deleted", "boolean", (col) => col.notNull().defaultTo(false))
		.addColumn("gender", sql`product_gender`, (col) => col.notNull())
		.addColumn("tags", sql`text[]`, (col) =>
			col.notNull().defaultTo(sql`'{}'::text[]`),
		)
		.addColumn("category_id", "uuid", (col) =>
			col.references("category.id").onDelete("set null").onUpdate("cascade"),
		)
		.addColumn("brand_id", "uuid", (col) =>
			col.references("brand.id").onDelete("set null").onUpdate("cascade"),
		)
		.addUniqueConstraint("uq_product_title_gender_category_brand", [
			"title",
			"gender",
			"category_id",
			"brand_id",
		])
		.execute();

	await db.schema
		.createIndex("idx_product_not_deleted")
		.on("product")
		.column("id")
		.where(sql<boolean>`is_deleted = false`)
		.execute();

	await db.schema
		.createTable("product_sku")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`),
		)
		.addColumn("price", "integer", (col) => col.notNull())
		.addColumn("sale_price", "integer")
		.addColumn("quantity", "integer", (col) =>
			col.notNull().check(sql`quantity >= 0`),
		)
		.addColumn("size", "varchar(10)", (col) => col.notNull())
		.addColumn("color", "varchar(10)", (col) => col.notNull())
		.addColumn("sku", "varchar(50)", (col) => col.notNull().unique())
		.addColumn("product_id", "uuid", (col) =>
			col.references("product.id").onDelete("cascade").onUpdate("cascade"),
		)
		.addUniqueConstraint("uq_product_sku_size_color", [
			"product_id",
			"size",
			"color",
		])
		.execute();

	await db.schema
		.createIndex("idx_product_sku_product_id")
		.on("product_sku")
		.columns(["product_id"])
		.execute();

	await db.schema
		.createTable("product_sku_image")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("created_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`),
		)
		.addColumn("updated_at", "timestamptz", (col) =>
			col.notNull().defaultTo(sql`now()`),
		)
		.addColumn("image_url", "text", (col) => col.notNull())
		.addColumn("image_id", "text", (col) => col.notNull())
		.addColumn("product_sku_id", "uuid", (col) =>
			col.references("product_sku.id").onDelete("cascade").onUpdate("cascade"),
		)
		.execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("product_sku_image").execute();
	await db.schema.dropTable("product_sku").execute();
	await db.schema.dropTable("product").execute();
	await db.schema.dropType("product_gender").execute();
}
