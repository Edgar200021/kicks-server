import type {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";
import type {
	GetAllAdminProductsRequestQuery
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import type {AdminProduct} from "@/features/admin/product/types/db.js";

export async function getAll(
	this: AdminProductRepository,
	query: GetAllAdminProductsRequestQuery,
): Promise<{
	count: number;
	products: AdminProduct[];
}> {
	const products = await this.buildProductQuery()
		.where((eb) => this.buildFilters(eb, {type: "regular", data: query}))
		.orderBy("p.createdAt", "desc")
		.limit(query.limit)
		.offset(query.limit * query.page - query.limit)
		.execute();

	const {count} = await this.db
		.selectFrom("product as p")
		.leftJoin("category as c", "c.id", "p.categoryId")
		.leftJoin("brand as b", "b.id", "p.brandId")
		.select((eb) => eb.fn.countAll().as("count"))
		.where((eb) => this.buildFilters(eb, {type: "regular", data: query}))
		.executeTakeFirstOrThrow();

	return {
		count: Number(count),
		products: products.map(
			({categoryId, categoryName, brandId, brandName, ...p}) => ({
				...p,
				category:
					categoryId && categoryName
						? {id: categoryId, name: categoryName}
						: null,
				brand: brandId && brandName ? {id: brandId, name: brandName} : null,
			}),
		),
	};
}