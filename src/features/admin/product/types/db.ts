import type {Selectable} from "kysely";
import type {Brand, Category, Product, ProductSku, ProductSkuImage} from "@/common/types/db.js";

export type AdminProduct = Omit<
	Selectable<Product>,
	"categoryId" | "brandId"
> & {
	category: Pick<Selectable<Category>, "id" | "name"> | null;
	brand: Pick<Selectable<Brand>, "id" | "name"> | null;
};

export type AdminProductSku = Omit<Selectable<ProductSku>, "productId"> & {
	images: Pick<Selectable<ProductSkuImage>, "id" | "imageId" | "imageUrl" | "imageName">[]
	product: AdminProduct
}