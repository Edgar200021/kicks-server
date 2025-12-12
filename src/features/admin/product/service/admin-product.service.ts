import type { AdminProductRepository } from "@/features/admin/product/repository/admin-product.repository.js";
import { create } from "./create.js";
import { getAll } from "./get-all.js";
import { getFilters } from "./get-filters.js";

export class AdminProductService {
	getAll = getAll;
	getFilters = getFilters;
	create = create;

	constructor(protected readonly productRepository: AdminProductRepository) {}
}
