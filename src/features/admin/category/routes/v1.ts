import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { ErrorResponseSchema } from "@/common/schemas/error-response.schema.js";
import { SuccessResponseSchema } from "@/common/schemas/success-response.schema.js";
import { ValidationErrorResponseSchema } from "@/common/schemas/validation-error-response.schema.js";
import {
	CreateCategoryRequestSchema,
	CreateCategoryResponseSchema,
} from "@/features/admin/category/schemas/create-category.schema.js";
import {
	GetAllCategoriesRequestQuerySchema,
	GetAllCategoriesResponseSchema,
} from "@/features/admin/category/schemas/get-all-categories.schema.js";
import {
	RemoveCategoryRequestParamsSchema,
	RemoveCategoryResponseSchema,
} from "@/features/admin/category/schemas/remove-category.schema.js";
import {
	UpdateCategoryRequestParamsSchema,
	UpdateCategoryRequestSchema,
	UpdateCategoryResponseSchema,
} from "@/features/admin/category/schemas/update-category.schema.js";

export const adminCategoryRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const { adminCategoryService } = fastify.services;

	fastify.get(
		"/",
		{
			schema: {
				querystring: GetAllCategoriesRequestQuerySchema,
				response: {
					200: SuccessResponseSchema(GetAllCategoriesResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Category"],
			},
		},
		async (req, reply) => {
			const data = await adminCategoryService.getAll(req.query);

			return reply.status(200).send({
				statusCode: 201,
				data,
			});
		},
	);

	fastify.post(
		"/",
		{
			schema: {
				body: CreateCategoryRequestSchema,
				response: {
					201: SuccessResponseSchema(CreateCategoryResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Category"],
			},
		},
		async (req, reply) => {
			const data = await adminCategoryService.create(req.body);

			return reply.status(201).send({
				statusCode: 201,
				data,
			});
		},
	);

	fastify.patch(
		"/:id",
		{
			schema: {
				params: UpdateCategoryRequestParamsSchema,
				body: UpdateCategoryRequestSchema,
				response: {
					200: SuccessResponseSchema(UpdateCategoryResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Category"],
			},
		},
		async (req, reply) => {
			await adminCategoryService.update(req.body, req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);

	fastify.delete(
		"/:id",
		{
			schema: {
				params: RemoveCategoryRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(RemoveCategoryResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Category"],
			},
		},
		async (req, reply) => {
			await adminCategoryService.remove(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);
};
