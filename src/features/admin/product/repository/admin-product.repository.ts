import {Insertable, Kysely, Selectable, sql, Updateable} from "kysely";
import type {Brand, Category, DB, Product} from "@/common/types/db.js";
import {getAll} from "./get-all.js";

export class AdminProductRepository {
	getAll = getAll;

	constructor(readonly db: Kysely<DB>) {
	}


	async getById(
		id: Selectable<Product>["id"],
	) {
		return await this.db
			.selectFrom("product")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	}

	async create(
		product: Insertable<Product>,
	) {
		const {id} = await this.db
			.insertInto("product")
			.values(product)
			.returning("id")
			.executeTakeFirstOrThrow();

		return id;
	}


	async update(
		id: Selectable<Product>["id"],
		product: Updateable<Product>,
	) {
		const result = await this.db
			.updateTable("product")
			.set({
				...product,
				updatedAt: sql`NOW
            ()`,
			})
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return result?.id;
	}

	async remove(
		id: Selectable<Product>["id"],
	) {
		const result = await this.db
			.updateTable("product")
			.set({
				updatedAt: sql`NOW
            ()`,
				isDeleted: sql<boolean>`NOT "is_deleted"`,
			})
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return result?.id;
	}


	async getFilters() {
		const result = await sql<{
			tags: string[];
			categories: {
				id: Selectable<Category>["id"];
				name: Selectable<Category>["name"];
			}[];
			availableCategories: {
				id: Selectable<Category>["id"];
				name: Selectable<Category>["name"];
			}[];
			brands: { id: Selectable<Brand>["id"]; name: Selectable<Brand>["name"] }[];
			availableBrands: { id: Selectable<Brand>["id"]; name: Selectable<Brand>["name"] }[];
		}>`
        SELECT ARRAY(
                       SELECT DISTINCT tag
                       FROM product,
                            UNNEST(tags) AS tag
               )                                           AS tags,

               (SELECT JSON_AGG(
                               JSON_BUILD_OBJECT('id', c.id, 'name', c.name)
                       )
                FROM category c
                WHERE EXISTS (SELECT 1
                              FROM product p
                              WHERE p.category_id = c.id)) AS "availableCategories",


               (SELECT JSON_AGG(
                               JSON_BUILD_OBJECT('id', c.id, 'name', c.name)
                       )
                FROM category c)                           as categories,


               (SELECT JSON_AGG(
                               JSON_BUILD_OBJECT('id', b.id, 'name', b.name)
                       )
                FROM brand b
                WHERE EXISTS (SELECT 1
                              FROM product p
                              WHERE p.brand_id = b.id))    AS "availableBrands",

               (SELECT JSON_AGG(
                               JSON_BUILD_OBJECT('id', b.id, 'name', b.name)
                       )
                FROM brand b)                              as brands

		`.execute(this.db);

		return result.rows[0];
	}

}