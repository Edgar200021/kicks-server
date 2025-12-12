import type {FastifyPluginAsyncZod} from "fastify-type-provider-zod";
import {
	ErrorResponseSchema,
	SuccessResponseSchema,
	ValidationErrorResponseSchema
} from "@/common/schemas/index.js";
import {
	GetAllAdminProductsRequestQuerySchema,
	GetAllAdminProductsResponseSchema
} from "@/features/admin/product/schemas/get-all-admin-products.schema.js";

export const adminProductRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const {adminProductService} = fastify.services

	fastify.get("/", {
		schema: {
			querystring: GetAllAdminProductsRequestQuerySchema,
			response: {
				200: SuccessResponseSchema(GetAllAdminProductsResponseSchema),
				400: ValidationErrorResponseSchema,
				401: ErrorResponseSchema,
				403: ErrorResponseSchema,
			},
		},
	}, async (req, reply) => {
		const data = await adminProductService.getAll(req.query)

		return reply.status(200).send({
			statusCode: 200,
			data
		})
	})
}