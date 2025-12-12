import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { ErrorResponseSchema } from "@/common/schemas/error-response.schema.js";
import { SuccessResponseSchema } from "@/common/schemas/success-response.schema.js";
import { ValidationErrorResponseSchema } from "@/common/schemas/validation-error-response.schema.js";
import {
	BlockToggleRequestParamsSchema,
	BlockToggleResponseSchema,
} from "@/features/admin/user/schemas/block-toggle.schema.js";
import {
	GetAllUsersRequestQuerySchema,
	GetAllUsersResponseSchema,
} from "@/features/admin/user/schemas/get-all-users.schema.js";
import {
	RemoveUserRequestParamsSchema,
	RemoveUserResponseSchema,
} from "@/features/admin/user/schemas/remove-user.schema.js";

export const adminUsersRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const { adminUserService } = fastify.services;

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
				tags: ["Admin/User"],
			},
		},
		async (req, reply) => {
			const data = await adminUserService.getAll(req.query);

			return reply.status(200).send({
				statusCode: 200,
				data,
			});
		},
	);

	fastify.delete(
		"/:id",
		{
			schema: {
				params: RemoveUserRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(RemoveUserResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/User"],
			},
		},
		async (req, reply) => {
			await adminUserService.remove(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
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
				tags: ["Admin/User"],
			},
		},
		async (req, reply) => {
			await adminUserService.blockToggle(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);
};
