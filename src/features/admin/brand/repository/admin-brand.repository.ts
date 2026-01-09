import {
	type Kysely,
	type OperandExpression,
	type Selectable,
	type SqlBool,
	sql,
	type Updateable,
} from "kysely";
import type { Brand, DB } from "@/common/types/db.js";
import type { GetAllBrandsRequestQuery } from "@/features/admin/brand/schemas/get-all-brands.schema.js";

export class AdminBrandRepository {
	constructor(readonly db: Kysely<DB>) {}

	async getAll(query: GetAllBrandsRequestQuery): Promise<Selectable<Brand>[]> {
		return await this.db
			.selectFrom("brand")
			.selectAll()
			.where((eb) => {
				const ands: OperandExpression<SqlBool>[] = [];

				if (query.search) {
					ands.push(eb("name", "ilike", `%${query.search}%`));
				}

				if (query.startDate) {
					ands.push(eb("createdAt", ">=", query.startDate));
				}

				if (query.endDate) {
					ands.push(eb("createdAt", "<=", query.endDate));
				}

				return eb.and(ands);
			})
			.orderBy("createdAt", "desc")
			.execute();
	}

	async getById(
		id: Selectable<Brand>["id"],
	): Promise<Selectable<Brand> | undefined> {
		return await this.db
			.selectFrom("brand")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	}

	async create(name: Selectable<Brand>["name"]): Promise<Selectable<Brand>> {
		return await this.db
			.insertInto("brand")
			.values({
				name,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	async remove(
		id: Selectable<Brand>["id"],
	): Promise<Selectable<Brand>["id"] | undefined> {
		const brand = await this.db
			.deleteFrom("brand")
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return brand?.id;
	}

	async updateById(
		id: Selectable<Brand>["id"],
		brand: Updateable<Brand>,
	): Promise<Selectable<Brand>["id"] | undefined> {
		const res = await this.db
			.updateTable("brand")
			.set({
				...brand,
				updatedAt: sql`NOW
            ()`,
			})
			.where("id", "=", id)
			.returning("id")
			.executeTakeFirst();

		return res?.id;
	}
}
