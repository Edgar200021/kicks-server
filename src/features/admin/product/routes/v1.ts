import type {FastifyPluginAsyncZod} from "fastify-type-provider-zod";
import z from "zod";
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
	CreateProductSkuRequestParamsSchema,
	CreateProductSkuRequestSchema,
	CreateProductSkuResponseSchema,
} from "@/features/admin/product/schemas/create-product-sku.schema.js";
import {
	GetAdminProductRequestParamsSchema,
	GetAdminProductResponseSchema,
} from "@/features/admin/product/schemas/get-admin-product.schema.js";
import {
	GetAdminProductFiltersResponseSchema
} from "@/features/admin/product/schemas/get-admin-product-filters.schema.js";
import {
	GetAllAdminProductsRequestQuerySchema,
	GetAllAdminProductsResponseSchema,
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";
import {
	RemoveProductRequestParamsSchema,
	RemoveProductResponseSchema,
} from "@/features/admin/product/schemas/remove-product.js";
import {
	UpdateProductRequestParamsSchema,
	UpdateProductRequestSchema,
	UpdateProductResponseSchema,
} from "@/features/admin/product/schemas/update-product.schema.js";
import {
	GetAllAdminProductsSkuRequestQuerySchema,
	GetAllAdminProductsSkuResponseSchema
} from "@/features/admin/product/schemas/get-all-admin-products-sku.schema.js";
import {
	GetAdminProductSkuRequestParamsSchema,
	GetAdminProductSkuResponseSchema
} from "@/features/admin/product/schemas/get-admin-product-sku.schema.js";
import {
	RemoveProductSkuRequestParamsSchema,
	RemoveProductSkuResponseSchema
} from "@/features/admin/product/schemas/remove-product-sku.js";
import {
	UpdateProductSkuRequestParamsSchema,
	UpdateProductSkuRequestSchema,
	UpdateProductSkuResponseSchema
} from "@/features/admin/product/schemas/update-product-sku.schema.js";

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
				summary: "Get all products"
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

	fastify.get(
		"/sku",
		{
			schema: {
				querystring: GetAllAdminProductsSkuRequestQuerySchema,
				response: {
					200: SuccessResponseSchema(GetAllAdminProductsSkuResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Get all products sku"
			},
		},
		async (req, reply) => {
			const data = await adminProductService.getAllSku(req.query);

			return reply.status(200).send({
				statusCode: 200,
				data,
			});
		},
	);

	fastify.get(
		"/:id",
		{
			schema: {
				params: GetAdminProductRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(GetAdminProductResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Get product by id"
			},
		},
		async (req, reply) => {
			const data = await adminProductService.getById(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data,
			});
		},
	);

	fastify.get(
		"/sku/:id",
		{
			schema: {
				params: GetAdminProductSkuRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(GetAdminProductSkuResponseSchema),
					400: ValidationErrorResponseSchema,
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Get product sku by id"
			},
		},
		async (req, reply) => {
			const data = await adminProductService.getSkuById(req.params);

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
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Create product"
			},
		},
		async (req, reply) => {
			const data = await adminProductService.create(req.body);

			return reply.status(201).send({
				statusCode: 201,
				data,
			});
		},
	);

	fastify.post(
		"/:id/sku",
		{
			schema: {
				consumes: ["multipart/form-data"],
				params: CreateProductSkuRequestParamsSchema,
				body: CreateProductSkuRequestSchema,
				response: {
					201: SuccessResponseSchema(CreateProductSkuResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Create product sku"
			},
		},
		async (req, reply) => {
			const data = await adminProductService.createSku(req.body, req.params);

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
				params: UpdateProductRequestParamsSchema,
				body: UpdateProductRequestSchema,
				response: {
					200: SuccessResponseSchema(UpdateProductResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Update product"
			},
		},
		async (req, reply) => {
			await adminProductService.update(req.body, req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);

	fastify.patch(
		"/sku/:id",
		{
			schema: {
				consumes: ["multipart/form-data"],
				params: UpdateProductSkuRequestParamsSchema,
				body: UpdateProductSkuRequestSchema,
				response: {
					200: SuccessResponseSchema(UpdateProductSkuResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Update product sku"
			},
		},
		async (req, reply) => {
			await adminProductService.updateSku(req.body, req.params);

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
				params: RemoveProductRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(RemoveProductResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Delete product"
			},
		},
		async (req, reply) => {
			await adminProductService.remove(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
			});
		},
	);

	fastify.delete(
		"/sku/:id",
		{
			schema: {
				params: RemoveProductSkuRequestParamsSchema,
				response: {
					200: SuccessResponseSchema(RemoveProductSkuResponseSchema),
					400: z.union([ErrorResponseSchema, ValidationErrorResponseSchema]),
					401: ErrorResponseSchema,
					403: ErrorResponseSchema,
					404: ErrorResponseSchema,
				},
				tags: ["Admin/Product"],
				summary: "Delete product sku"
			},
		},
		async (req, reply) => {
			await adminProductService.removeSku(req.params);

			return reply.status(200).send({
				statusCode: 200,
				data: null,
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