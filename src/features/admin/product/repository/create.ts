import type {Insertable} from "kysely";
import type {Product} from "@/common/types/db.js";
import type {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";

export async function create(
	this: AdminProductRepository,
	product: Insertable<Product>,
) {
	const {id} = await this.db.insertInto("product").values(product).returning("id").executeTakeFirstOrThrow();

	return id
}