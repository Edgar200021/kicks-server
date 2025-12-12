import { type Selectable, sql } from "kysely";
import type { Brand, Category } from "@/common/types/db.js";
import type { AdminProductRepository } from "@/features/admin/product/repository/admin-product.repository.js";

export async function getFilters(this: AdminProductRepository) {
	const result = await sql<{
		tags: string[];
		categories: {
			id: Selectable<Category>["id"];
			name: Selectable<Category>["name"];
		}[];
		brands: { id: Selectable<Brand>["id"]; name: Selectable<Brand>["name"] }[];
	}>`
      SELECT ARRAY(
                 SELECT DISTINCT tag
        FROM product, UNNEST(tags) AS tag
             )                                           AS tags,

             (SELECT JSON_AGG(
                             JSON_BUILD_OBJECT('id', c.id, 'name', c.name)
                     )
              FROM category c
              WHERE EXISTS (SELECT 1
                            FROM product p
                            WHERE p.category_id = c.id)) AS categories,

             (SELECT JSON_AGG(
                             JSON_BUILD_OBJECT('id', b.id, 'name', b.name)
                     )
              FROM brand b
              WHERE EXISTS (SELECT 1
                            FROM product p
                            WHERE p.brand_id = b.id))    AS brands

	`.execute(this.db);

	return result.rows[0];
}
