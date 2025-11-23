import z from "zod";
import { PaginationSchema } from "@/common/schemas/pagination.schema.js";
import { PageCountSchema } from "@/common/schemas/with-page-count.schema.js";
import { UserGender } from "@/common/types/db.js";
import {
	GET_ALL_USERS_DEFAULT_LIMIT,
	GET_ALL_USERS_MAX_LIMIT,
	GET_ALL_USERS_SEARCH_MAX_LENGTH,
} from "@/features/admin/users/const/zod.js";
import { AdminUserSchema } from "@/features/admin/users/schemas/user.schema.js";

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
	})
	.and(
		PaginationSchema({
			maxLimit: GET_ALL_USERS_MAX_LIMIT,
			defaultLimit: GET_ALL_USERS_DEFAULT_LIMIT,
		}),
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
