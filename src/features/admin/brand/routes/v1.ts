import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import {
	ErrorResponseSchema,
	SuccessResponseSchema,
	ValidationErrorResponseSchema,
} from "@/common/schemas/index.js";
import {
	CreateBrandRequestSchema,
	CreateBrandResponseSchema,
} from "@/features/admin/brand/schemas/create-brand.schema.js";
import {
	GetAllBrandsRequestQuerySchema,
	GetAllBrandsResponseSchema,
} from "@/features/admin/brand/schemas/get-all-brands.schema.js";
import {
	RemoveBrandRequestParamsSchema,
	RemoveBrandResponseSchema,
} from "@/features/admin/brand/schemas/remove-brand.schema.js";
import {
	UpdateBrandRequestParamsSchema,
	UpdateBrandRequestSchema,
	UpdateBrandResponseSchema,
} from "@/features/admin/brand/schemas/update-brand.schema.js";

export const adminBrandRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const { adminBrandService } = fastify.services;

	fastify.get(
		"/",
		{
			schema: {
				querystring: GetAllBrandsRequestQuerySchema,
				response: {
					200: SuccessResponseSchema(GetAllBrandsResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Brand"],
			},
		},
		async (req, reply) => {
			const data = await adminBrandService.getAll(req.query);

			return reply.status(200).send({
				statusCode: 200,
				data,
			});
		},
	);

	fastify.post(
		"/",
		{
			schema: {
				body: CreateBrandRequestSchema,
				response: {
					201: SuccessResponseSchema(CreateBrandResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Brand"],
			},
		},
		async (req, reply) => {
			const data = await adminBrandService.create(req.body);

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
				params: UpdateBrandRequestParamsSchema,
				body: UpdateBrandRequestSchema,
				response: {
					200: SuccessResponseSchema(UpdateBrandResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Brand"],
			},
		},
		async (req, reply) => {
			await adminBrandService.update(req.body, req.params);

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
				params: RemoveBrandRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(RemoveBrandResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Brand"],
			},
		},
		async (req, reply) => {
			await adminBrandService.remove(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);
};
