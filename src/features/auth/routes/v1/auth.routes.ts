import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { OAUTH_COOKIE_SESSION_PREFIX } from "@/common/const/cookie.js";
import { ErrorResponseSchema } from "@/common/schemas/error-response.schema.js";
import {
	SuccessResponseSchema,
	ValidationErrorResponseSchema,
} from "@/common/schemas/index.js";
import {
	GoogleSignInRequestSchema,
	GoogleSignInResponseSchema,
} from "../../schemas/google-sign-in.schema.js";
import { OAuth2RedirectUrlRequestQuerySchema } from "../../schemas/oauth2-redirect-url.js";
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
	VerifyAccountResponseSchema,
} from "../../schemas/verify-account.schema.js";

export const authRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const { config } = fastify;

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
			const { sessionId, data } = await fastify.services.authService.signIn(
				req.body,
			);
			return reply
				.status(200)
				.cookie(config.application.sessionCookieName, sessionId, {
					maxAge: config.application.sessionTTLMinutes * 60,
				})
				.send({ statusCode: 200, data });
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
					200: SuccessResponseSchema(VerifyAccountResponseSchema),
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

	fastify.get(
		"/google",
		{
			// config: {
			// 	rateLimit: {
			// 		timeWindow: "1 minute",
			// 		max: fastify.config.rateLimit.signUpLimit,
			// 	},
			// },
			schema: {
				querystring: OAuth2RedirectUrlRequestQuerySchema,
				response: {
					// 201: SuccessResponseSchema(SignUpResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const url = fastify.services.authService.genereateOauth2RedirectUrl(
				req.query,
				"google",
			);

			return reply.redirect(url);
		},
	);

	fastify.post(
		"/google",
		{
			// config: {
			// 	rateLimit: {
			// 		timeWindow: "1 minute",
			// 		max: fastify.config.rateLimit.signUpLimit,
			// 	},
			// },
			schema: {
				body: GoogleSignInRequestSchema,
				response: {
					200: SuccessResponseSchema(GoogleSignInResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const { sessionId, data } =
				await fastify.services.authService.googleSignIn(req.body);

			return reply
				.cookie(
					config.application.sessionCookieName,
					`${OAUTH_COOKIE_SESSION_PREFIX}${sessionId}`,
					{
						maxAge: config.application.sessionTTLMinutes * 60,
					},
				)
				.status(200)
				.send({ statusCode: 200, data });
		},
	);
};
