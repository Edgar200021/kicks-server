import z from "zod";
import { ProductGender } from "@/common/types/db.js";

export const AdminProductSchema = z.object({
	id: z.uuid().nonempty(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	title: z.string(),
	description: z.string(),
	gender: z.enum(ProductGender),
	tags: z.string().array(),
	isDeleted: z.boolean(),
	category: z
		.object({
			id: z.uuid().nonempty(),
			name: z.string().nonempty(),
		})
		.nullable(),
	brand: z
		.object({
			id: z.uuid().nonempty(),
			name: z.string().nonempty(),
		})
		.nullable(),
});
