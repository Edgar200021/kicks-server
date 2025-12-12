import type {FastifyPluginAsyncZod} from "fastify-type-provider-zod";
import {
	ErrorResponseSchema,
	SuccessResponseSchema,
	ValidationErrorResponseSchema,
} from "@/common/schemas/index.js";
import {
	CreateProductRequestSchema,
	CreateProductResponseSchema,
} from "@/features/admin/product/schemas/create-product.schema.js";
import {
	GetAdminProductFiltersResponseSchema
} from "@/features/admin/product/schemas/get-admin-product-filters.schema.js";
import {
	GetAllAdminProductsRequestQuerySchema,
	GetAllAdminProductsResponseSchema,
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import z from "zod";

export const adminProductRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const {adminProductService} = fastify.services;

	fastify.get(
		"/",
		{
			schema: {
				querystring: GetAllAdminProductsRequestQuerySchema,
				response: {
					200: SuccessResponseSchema(GetAllAdminProductsResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
			},
		},
		async (req, reply) => {
			const data = await adminProductService.getAll(req.query);

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
				body: CreateProductRequestSchema,
				response: {
					201: SuccessResponseSchema(CreateProductResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema
				},
				tags: ["Admin/Product"],
			},
		},
		async (req, reply) => {
			const data = await adminProductService.create(req.body);

			console.log(data)

			return reply.status(201).send({
				statusCode: 201,
				data,
			});
		},
	);

	fastify.get(
		"/filters",
		{
			schema: {
				response: {
					200: SuccessResponseSchema(GetAdminProductFiltersResponseSchema),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
			},
		},
		async (_, reply) => {
			const data = await adminProductService.getFilters();

			return reply.status(200).send({
				statusCode: 200,
				data,
			});
		},
	);
};