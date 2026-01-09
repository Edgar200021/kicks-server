import {
	ExpressionBuilder,
	type ExpressionWrapper,
	type Insertable,
	type Kysely,
	type Nullable,
	type OperandExpression,
	type Selectable,
	sql,
	type SqlBool,
	type Updateable,
} from "kysely";
import type {
	Brand,
	Category,
	DB,
	Product,
	ProductSku,
	ProductSkuImage,
} from "@/common/types/db.js";
import type {AdminProduct, AdminProductSku} from "@/features/admin/product/types/db.js";
import {getAll} from "./get-all.js";
import {
	GetAllAdminProductsRequestQuery
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import {getAllSku} from "@/features/admin/product/repository/get-all-sku.js";
import {
	GetAllAdminProductsSkuRequestQuery
} from "@/features/admin/product/schemas/get-all-admin-products-sku.schema.js";

export class AdminProductRepository {
	getAll = getAll;
	getAllSku = getAllSku

	constructor(readonly db: Kysely<DB>) {
	}

	async getById(
		id: Selectable<Product>["id"],
	): Promise<AdminProduct | undefined> {
		const product = await this.buildProductQuery()
			.where("p.id", "=", id)
			.executeTakeFirst();

		if (!product) return undefined;

		const {categoryId, categoryName, brandId, brandName, ...p} = product;
		return {
			...p,
			category:
				categoryId && categoryName
					? {id: categoryId, name: categoryName}
					: null,
			brand: brandId && brandName ? {id: brandId, name: brandName} : null,
		};
	}

	async getSkuById(
		id: Selectable<ProductSku>["id"],
	): Promise<AdminProductSku | undefined> {
		const productSku = await this.buildProductSkuQuery()
			.where("ps.id", "=", id)
			.executeTakeFirst();

		if (!productSku) return undefined;

		const {
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
		} = productSku


		return {
			...productSku,
			price: productSku.price,
			salePrice: productSku.salePrice ? productSku.salePrice : null,
			images: productSku.images ?? [],
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
		}

	}

	async create(product: Insertable<Product>) {
		const {id} = await this.db
			.insertInto("product")
			.values(product)
			.returning("id")
			.executeTakeFirstOrThrow();

		return id;
	}

	async createSku(
		productSku: Insertable<ProductSku>,
		images: Insertable<Omit<ProductSkuImage, "productSkuId">>[],
	) {
		return await this.db.transaction().execute(async (trx) => {
			const {id} = await trx
				.insertInto("productSku")
				.values(productSku)
				.returning("id")
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("productSkuImage")
				.values(
					images.map((i) => ({
						...i,
						productSkuId: id,
					})),
				)
				.execute();

			return id;
		});
	}

	async update(id: Selectable<Product>["id"], product: Updateable<Product>) {
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


	async updateSku(id: Selectable<ProductSku>["id"], productSku: Updateable<ProductSku>, images: Insertable<Omit<ProductSkuImage, "productSkuId">>[] | undefined) {

		return await this.db.transaction().execute(async trx => {
			try {
				const result = await trx
					.updateTable("productSku")
					.set({
						...productSku,
						updatedAt: sql`NOW
                ()`,
					})
					.where("id", "=", id)
					.returning("id")
					.executeTakeFirstOrThrow();


				if (images) {
					await trx.insertInto("productSkuImage")
						.values(
							images.map((i) => ({
								...i,
								productSkuId: result.id,
							})),
						)
						.execute();
				}

				return result.id;
			} catch (err) {

				throw err
			}
		})


	}

	async remove(id: Selectable<Product>["id"]) {
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

	async removeSku(id: Selectable<ProductSku>["id"]) {
		const result = await this.db
			.deleteFrom("productSku")
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
			brands: {
				id: Selectable<Brand>["id"];
				name: Selectable<Brand>["name"];
			}[];
			availableBrands: {
				id: Selectable<Brand>["id"];
				name: Selectable<Brand>["name"];
			}[];
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


	protected buildProductQuery() {
		return this.db
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
	}

	protected buildProductSkuQuery() {
		return this.db.selectFrom("productSku as ps")
			.innerJoin("product as p", "p.id", "ps.productId")
			.leftJoin("category as c", "c.id", "p.categoryId")
			.leftJoin("brand as b", "b.id", "p.brandId")
			.select([
				"ps.id",
				"ps.sku",
				"ps.price",
				"ps.salePrice",
				"ps.quantity",
				"ps.color",
				"ps.size",
				"ps.createdAt",
				"ps.updatedAt",
				"p.id as pId",
				"p.createdAt as pCr",
				"p.updatedAt as pUp",
				"p.title as pTitle",
				"p.description as pDescription",
				"p.isDeleted as pIsDeleted",
				"p.gender as pGender",
				"p.tags as pTags",
				"c.id as categoryId",
				"c.name as categoryName",
				"b.id as brandId",
				"b.name as brandName",
			])
			.select(eb =>
				eb
					.selectFrom("productSkuImage")
					.select(
						sql<AdminProductSku["images"]>`
                JSON_AGG
                ( JSON_BUILD_OBJECT(
                    'id', product_sku_image.id,
                    'imageId', product_sku_image.image_id,
                    'imageUrl', product_sku_image.image_url,
                    'imageName', product_sku_image.image_name
                    ))
						`.as("images")
					)
					.whereRef("productSkuImage.productSkuId", "=", eb.ref("ps.id"))
					.as("images")
			)
	}

	buildFilters(
		eb: ExpressionBuilder<
			DB & {
			p: Product;
			c: Nullable<Category>;
			b: Nullable<Brand>;
			ps: Nullable<ProductSku>
		},
			"p" | "ps" | "c" | "b"
		>,
		{type, data}: {
			type: "regular",
			data: GetAllAdminProductsRequestQuery
		} | { type: "sku", data: GetAllAdminProductsSkuRequestQuery },
	): ExpressionWrapper<DB, "product" | "productSku" | "category" | "brand", SqlBool> {
		const ands: OperandExpression<SqlBool>[] = [];

		if (type === "sku") {
			if (data.minPrice !== undefined) {
				ands.push(eb("ps.price", ">=", data.minPrice * 100));
			}

			if (data.maxPrice) {
				ands.push(eb("ps.price", "<=", data.maxPrice * 100));
			}

			if (data.minSalePrice !== undefined) {
				ands.push(eb("ps.salePrice", ">=", data.minSalePrice * 100));
			}

			if (data.maxSalePrice) {
				ands.push(eb("ps.salePrice", "<=", data.maxSalePrice * 100));
			}

			if (data.inStock !== undefined) {
				ands.push(eb("ps.quantity", data.inStock ? ">" : "=", 0))
			}

			if (data.size) {
				ands.push(eb("ps.size", "=", data.size));
			}

			if (data.color) {
				ands.push(eb("ps.color", "=", data.color));
			}
		}

		if (data.startDate) {
			ands.push(eb(type === "regular" ? "p.createdAt" : "ps.createdAt", ">=", data.startDate));
		}

		if (data.endDate) {
			ands.push(eb(type === "regular" ? "p.createdAt" : "ps.createdAt", "<=", data.endDate));
		}

		if (data.gender) {
			ands.push(eb("p.gender", "=", data.gender));
		}

		if (data.tags?.length) {
			ands.push(
				sql<boolean>`p
      .
      tags
      &&
        ${data.tags}`,
			);
		}

		if (data.isDeleted !== undefined) {
			ands.push(eb("isDeleted", "=", data.isDeleted));
		}


		if (data.search) {
			const conditions = [
				eb("title", "ilike", `%${data.search}%`),
				eb("description", "ilike", `%${data.search}%`),
			];

			if (type === "sku") {
				conditions.unshift(eb("sku", "=", data.search));
			}

			ands.push(eb.or(conditions));
		}


		if (data.categoryId) {
			ands.push(eb("p.categoryId", "=", data.categoryId));
		}

		if (data.brandId) {
			ands.push(eb("p.brandId", "=", data.brandId));
		}


		return eb.and(ands);
	}


}