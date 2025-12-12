import z from "zod";

export const BrandSchema = z.object({
	id: z.uuid().nonempty(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	name: z.string().nonempty(),
});
