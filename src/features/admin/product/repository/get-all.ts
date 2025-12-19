import {
	type ExpressionBuilder,
	type ExpressionWrapper,
	type Nullable,
	type OperandExpression,
	type Selectable,
	sql,
	type SqlBool,
} from "kysely";
import type {Brand, Category, DB, Product} from "@/common/types/db.js";
import type {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";
import type {
	GetAllAdminProductsRequestQuery
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";

export async function getAll(
	this: AdminProductRepository,
	query: GetAllAdminProductsRequestQuery,
): Promise<{
	count: number;
	products: (Omit<Selectable<Product>, "categoryId" | "brandId"> & {
		category: Pick<Selectable<Category>, "id" | "name"> | null;
		brand: Pick<Selectable<Brand>, "id" | "name"> | null;
	})[];
}> {
	const products = await this.db
		.selectFrom("product as p")
		.leftJoin("category as c", "c.id", "p.categoryId")
		.leftJoin("brand as b", "b.id", "p.brandId")
		.select([
			"p.id",
			"p.createdAt",
			"p.updatedAt",
			"p.title",
			"p.description",
			"p.isDeleted",
			"p.gender",
			"p.tags",
			"c.id as categoryId",
			"c.name as categoryName",
			"b.id as brandId",
			"b.name as brandName",
		])
		.where((eb) => buildFilters(eb, query))
		.orderBy("p.createdAt", "desc")
		.limit(query.limit)
		.offset(query.limit * query.page - query.limit)
		.execute();

	const {count} = await this.db
		.selectFrom("product as p")
		.leftJoin("category as c", "c.id", "p.categoryId")
		.leftJoin("brand as b", "b.id", "p.brandId")
		.select((eb) => eb.fn.countAll().as("count"))
		.where((eb) => buildFilters(eb, query))
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

function buildFilters(
	eb: ExpressionBuilder<
		DB & {
		p: Product;
	} & {
		c: Nullable<Category>;
	} & {
		b: Nullable<Brand>;
	},
		"p" | "c" | "b"
	>,
	query: GetAllAdminProductsRequestQuery,
): ExpressionWrapper<DB, "product" | "category" | "brand", SqlBool> {
	const ands: OperandExpression<SqlBool>[] = [];

	if (query.startDate) {
		ands.push(eb("p.createdAt", ">=", query.startDate));
	}

	if (query.endDate) {
		ands.push(eb("p.createdAt", "<=", query.endDate));
	}

	if (query.gender) {
		ands.push(eb("p.gender", "=", query.gender));
	}

	if (query.tags?.length) {
		ands.push(
			sql<boolean>`p
      .
      tags
      &&
      ${query.tags}`,
		);
	}

	if (query.isDeleted !== undefined) {
		ands.push(eb("isDeleted", "=", query.isDeleted));
	}

	if (query.search) {
		ands.push(
			eb.or([
				eb("title", "ilike", `%${query.search}%`),
				eb("description", "ilike", `%${query.search}%`),
			]),
		);
	}

	if (query.categoryId) {
		ands.push(eb("p.categoryId", "=", query.categoryId));
	}

	if (query.brandId) {
		ands.push(eb("p.brandId", "=", query.brandId));
	}

	return eb.and(ands);
}