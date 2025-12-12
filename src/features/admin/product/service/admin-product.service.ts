import {
	AdminProductRepository
} from "@/features/admin/product/repository/admin-product.repository.js";
import {getAll} from "./get-all.js"


export class AdminProductService {
	getAll = getAll

	constructor(protected readonly productRepository: AdminProductRepository) {
	}
}