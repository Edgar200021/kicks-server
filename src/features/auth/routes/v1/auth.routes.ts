import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import {
	ErrorResponseSchema,
	SuccessResponseSchema,
	ValidationErrorResponseSchema,
} from "@/common/schemas/base.js";
import {
	SignInRequestSchema,
	SignInResponseSchema,
} from "../../schemas/sign-in.schema.js";
import {
	SignUpRequestSchema,
	SignUpResponseSchema,
} from "../../schemas/sign-up.schema.js";
import {
	VerifyAccountRequestSchema,
	VerifyAccountResponeSchema,
} from "../../schemas/verify-account.schema.js";

export const authRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	fastify.post(
		"/sign-up",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.signUpLimit,
				},
			},
			schema: {
				body: SignUpRequestSchema,
				response: {
					201: SuccessResponseSchema(SignUpResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			await fastify.services.authService.signUp(req.body);
			return reply.status(201).send({ statusCode: 201, data: null });
		},
	);

	fastify.post(
		"/sign-in",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.signInLimit,
				},
			},
			schema: {
				body: SignInRequestSchema,
				response: {
					200: SuccessResponseSchema(SignInResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const user = await fastify.services.authService.signIn(req.body);
			return reply.status(200).send({ statusCode: 200, data: user });
		},
	);

	fastify.post(
		"/verify-account",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.accountVerificationLimit,
				},
			},
			schema: {
				body: VerifyAccountRequestSchema,
				response: {
					200: SuccessResponseSchema(VerifyAccountResponeSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			await fastify.services.authService.verifyAccount(req.body);
			return reply.status(200).send({ statusCode: 200, data: null });
		},
	);
};
