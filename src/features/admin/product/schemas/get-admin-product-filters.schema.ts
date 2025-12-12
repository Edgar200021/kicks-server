import z from "zod";

export const GetAdminProductFiltersResponseSchema = z.object({
	tags: z.string().array(),
	categories: z
		.object({
			id: z.uuid().nonempty(),
			name: z.string().nonempty(),
		})
		.array(),
	brands: z
		.object({
			id: z.uuid().nonempty(),
			name: z.string().nonempty(),
		})
		.array(),
});

export type GetAdminProductFiltersResponse = z.infer<
	typeof GetAdminProductFiltersResponseSchema
>;
