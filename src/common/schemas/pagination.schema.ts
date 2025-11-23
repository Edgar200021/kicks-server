import z from "zod";

export const PaginationSchema = ({
	maxLimit,
	defaultLimit,
}: {
	maxLimit: number;
	defaultLimit: number;
}) => {
	return z.object({
		page: z.coerce.number().positive().optional().default(1),
		limit: z.coerce
			.number()
			.positive()
			.max(maxLimit)
			.optional()
			.default(defaultLimit),
	});
};
