import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { ErrorResponseSchema } from "@/common/schemas/error-response.schema.js";
import { SuccessResponseSchema } from "@/common/schemas/success-response.schema.js";
import { ValidationErrorResponseSchema } from "@/common/schemas/validation-error-response.schema.js";
import {
	BlockToggleRequestParamsSchema,
	BlockToggleResponseSchema,
} from "@/features/admin/users/schemas/block-toggle.schema.js";
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
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
			},
		},
		async (req, reply) => {
			const data = await adminUsersService.getAll(req.query);

			return reply.status(200).send({
				statusCode: 200,
				data,
			});
		},
	);

	fastify.patch(
		"/:id/block-toggle",
		{
			schema: {
				params: BlockToggleRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(BlockToggleResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
			},
		},
		async (req, reply) => {
			await adminUsersService.blockToggle(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);
};
