import type {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";
import type {
	GetAllAdminProductsRequestQuery
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import type {AdminProductSku} from "@/features/admin/product/types/db.js";

export async function getAllSku(
	this: AdminProductRepository,
	query: GetAllAdminProductsRequestQuery,
): Promise<{
	count: number;
	productsSku: AdminProductSku[];
}> {
	const productsSku = await this.buildProductSkuQuery()
		.where((eb) => this.buildFilters(eb, {type: "sku", data: query}))
		.orderBy("ps.createdAt", "desc")
		.limit(query.limit)
		.offset(query.limit * query.page - query.limit)
		.execute();


	const {count} = await this.db
		.selectFrom("productSku as ps")
		.innerJoin("product as p", "p.id", "ps.productId")
		.leftJoin("category as c", "c.id", "p.categoryId")
		.leftJoin("brand as b", "b.id", "p.brandId")
		.select((eb) => eb.fn.countAll().as("count"))
		.where((eb) => this.buildFilters(eb, {type: "sku", data: query}))
		.executeTakeFirstOrThrow();

	return {
		count: Number(count),
		productsSku: productsSku.map(
			({
				 categoryId,
				 categoryName,
				 brandId,
				 brandName,
				 pId,
				 pCr,
				 pUp,
				 pTitle,
				 pDescription,
				 pIsDeleted,
				 pGender,
				 pTags,
				 ...p
			 }) => ({
				...p,
				price: p.price,
				salePrice: p.salePrice ? p.salePrice : null,
				images: p.images ?? [],
				product: {
					id: pId,
					createdAt: pCr,
					updatedAt: pUp,
					title: pTitle,
					description: pDescription,
					isDeleted: pIsDeleted,
					gender: pGender,
					tags: pTags,
					category:
						categoryId && categoryName
							? {id: categoryId, name: categoryName}
							: null,
					brand: brandId && brandName ? {id: brandId, name: brandName} : null,
				}
			}),
		),
	};
}