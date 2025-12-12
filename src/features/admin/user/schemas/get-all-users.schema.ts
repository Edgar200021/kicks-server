import z from "zod";
import { PaginationSchema } from "@/common/schemas/pagination.schema.js";
import { PageCountSchema } from "@/common/schemas/with-page-count.schema.js";
import { UserGender } from "@/common/types/db.js";
import {
	GET_ALL_USERS_DEFAULT_LIMIT,
	GET_ALL_USERS_MAX_LIMIT,
	GET_ALL_USERS_SEARCH_MAX_LENGTH,
} from "@/features/admin/user/const/index.js";
import { AdminUserSchema } from "@/features/admin/user/schemas/user.schema.js";

export const GetAllUsersRequestQuerySchema = z
	.object({
		isBanned: z
			.enum(["true", "false"])
			.transform((value) => value === "true")
			.optional(),
		isVerified: z
			.enum(["true", "false"])
			.transform((value) => value === "true")
			.optional(),
		search: z.string().max(GET_ALL_USERS_SEARCH_MAX_LENGTH).optional(),
		gender: z.enum(UserGender).optional(),
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
	})
	.and(
		PaginationSchema({
			maxLimit: GET_ALL_USERS_MAX_LIMIT,
			defaultLimit: GET_ALL_USERS_DEFAULT_LIMIT,
		}),
	)
	.refine(
		(obj) =>
			!obj.startDate || !obj.endDate
				? true
				: obj.endDate.getTime() > obj.startDate.getTime(),
		{
			path: ["startDate"],
		},
	);

export const GetAllUsersResponseSchema = z
	.object({
		users: z.array(AdminUserSchema),
	})
	.and(PageCountSchema);

export type GetAllUsersRequestQuery = z.infer<
	typeof GetAllUsersRequestQuerySchema
>;

export type GetAllUsersResponse = z.infer<typeof GetAllUsersResponseSchema>;
