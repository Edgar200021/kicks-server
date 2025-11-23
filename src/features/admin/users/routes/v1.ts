import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { ErrorResponseSchema } from "@/common/schemas/error-response.schema.js";
import { SuccessResponseSchema } from "@/common/schemas/success-response.schema.js";
import { ValidationErrorResponseSchema } from "@/common/schemas/validation-error-response.schema.js";
import {
	GetAllUsersRequestQuerySchema,
	GetAllUsersResponseSchema,
} from "@/features/admin/users/schemas/get-all-users.schema.js";

export const adminUsersRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const { adminUsersService } = fastify.services;

	fastify.get(
		"/",
		{
			schema: {
				querystring: GetAllUsersRequestQuerySchema,
				response: {
					200: SuccessResponseSchema(GetAllUsersResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
			},
		},
		async (req, reply) => {
			const data = await adminUsersService.getAll(req.query);

			return reply.status(200).send({
				statusCode: 200,
				data: {
					pageCount: data.pageCount,
					users: data.users,
				},
			});
		},
	);
};
