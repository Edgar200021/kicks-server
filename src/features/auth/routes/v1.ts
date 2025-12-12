import { httpErrors } from "@fastify/sensible";
import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { OAUTH_COOKIE_SESSION_PREFIX } from "@/common/const/cookie.js";
import { ErrorResponseSchema } from "@/common/schemas/error-response.schema.js";
import {
	SuccessResponseSchema,
	ValidationErrorResponseSchema,
} from "@/common/schemas/index.js";
import { FacebookSignInRequestQuerySchema } from "@/features/auth/schemas/facebook-sign-in.schema.js";
import {
	ForgotPasswordRequestSchema,
	ForgotPasswordResponseSchema,
} from "@/features/auth/schemas/forgot-password.schema.js";
import {
	ResetPasswordRequestSchema,
	ResetPasswordResponseSchema,
} from "@/features/auth/schemas/reset-password.schema.js";
import { UserSchema } from "@/features/user/schemas/user.schema.js";
import { GoogleSignInRequestQuerySchema } from "../schemas/google-sign-in.schema.js";
import { OAuth2RedirectUrlRequestQuerySchema } from "../schemas/oauth2-redirect-url.js";
import {
	SignInRequestSchema,
	SignInResponseSchema,
} from "../schemas/sign-in.schema.js";
import {
	SignUpRequestSchema,
	SignUpResponseSchema,
} from "../schemas/sign-up.schema.js";
import {
	VerifyAccountRequestSchema,
	VerifyAccountResponseSchema,
} from "../schemas/verify-account.schema.js";

export const authRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	const { config } = fastify;

	const getOAuthState = (req: FastifyRequest) => {
		const cookieState = req.cookies[config.application.oauthStateCookieName];
		if (!cookieState) {
			throw httpErrors.badRequest("Invalid oauth state");
		}

		const unsigned = req.unsignCookie(cookieState);
		if (!unsigned.valid) {
			throw httpErrors.badRequest("Invalid oauth state");
		}

		return unsigned.value;
	};

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
			return reply.status(201).send({
				statusCode: 201,
				data: "Check your email and follow the link we sent to complete the verification.",
			});
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
			const { sessionValue } = req.getSession();

			const { sessionId, data } = await fastify.services.authService.signIn(
				req.body,
				sessionValue,
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

	fastify.post(
		"/forgot-password",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.forgotPasswordLimit,
				},
			},
			schema: {
				body: ForgotPasswordRequestSchema,
				response: {
					200: SuccessResponseSchema(ForgotPasswordResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
					404: ErrorResponseSchema,
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			await fastify.services.authService.forgotPassword(req.body);
			return reply.status(200).send({
				statusCode: 200,
				data: "If this email is registered, you will receive password reset instructions shortly.",
			});
		},
	);

	fastify.post(
		"/reset-password",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.resetPasswordLimit,
				},
			},
			schema: {
				body: ResetPasswordRequestSchema,
				response: {
					200: SuccessResponseSchema(ResetPasswordResponseSchema),
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			await fastify.services.authService.resetPassword(req.body);
			return reply.status(200).send({
				statusCode: 200,
				data: "Password has been reset successfuly.",
			});
		},
	);

	fastify.get(
		"/google",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.signInLimit,
				},
			},
			schema: {
				querystring: OAuth2RedirectUrlRequestQuerySchema,
				response: {
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const { url, cookieState } =
				fastify.services.authService.genereateOauth2RedirectUrl(
					req.query,
					"google",
				);

			return reply
				.setCookie(config.application.oauthStateCookieName, cookieState, {
					maxAge: config.application.oauthStateTTLMinutes * 60,
				})
				.redirect(url);
		},
	);

	fastify.get(
		"/google/callback",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.signInLimit,
				},
			},
			schema: {
				querystring: GoogleSignInRequestQuerySchema,
				response: {
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const cookieState = getOAuthState(req);
			const { sessionId, redirectUrl } =
				await fastify.services.authService.googleSignIn(req.query, cookieState);

			return reply
				.cookie(
					config.application.sessionCookieName,
					`${OAUTH_COOKIE_SESSION_PREFIX}${sessionId}`,
					{
						maxAge: config.application.oauthSessionTTLMinutes * 60,
					},
				)
				.redirect(redirectUrl);
		},
	);

	fastify.get(
		"/facebook",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.signInLimit,
				},
			},
			schema: {
				querystring: OAuth2RedirectUrlRequestQuerySchema,
				response: {
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const { url, cookieState } =
				fastify.services.authService.genereateOauth2RedirectUrl(
					req.query,
					"facebook",
				);

			return reply
				.setCookie(config.application.oauthStateCookieName, cookieState, {
					maxAge: config.application.oauthStateTTLMinutes * 60,
				})
				.redirect(url);
		},
	);

	fastify.get(
		"/facebook/callback",
		{
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.signInLimit,
				},
			},
			schema: {
				querystring: FacebookSignInRequestQuerySchema,
				response: {
					400: z.union([ValidationErrorResponseSchema, ErrorResponseSchema]),
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const cookieState = getOAuthState(req);
			const { sessionId, redirectUrl } =
				await fastify.services.authService.facebookSignIn(
					req.query,
					cookieState,
				);

			return reply
				.cookie(
					config.application.sessionCookieName,
					`${OAUTH_COOKIE_SESSION_PREFIX}${sessionId}`,
					{
						maxAge: config.application.oauthSessionTTLMinutes * 60,
					},
				)
				.redirect(redirectUrl);
		},
	);

	fastify.get(
		"/me",
		{
			onRequest: async (req, reply) => await req.authenticate(reply),
			schema: {
				response: {
					200: SuccessResponseSchema(UserSchema),
				},
			},
		},
		async (req, reply) => {
			if (!req.user) {
				throw httpErrors.unauthorized("Unauthorized");
			}

			return reply.status(200).send({
				statusCode: 200,
				data: {
					email: req.user.email,
					firstName: req.user.firstName,
					lastName: req.user.lastName,
					gender: req.user.gender,
					role: req.user.role,
				},
			});
		},
	);

	fastify.post(
		"/logout",
		{
			onRequest: async (req, reply) => await req.authenticate(reply),
			config: {
				rateLimit: {
					timeWindow: "1 minute",
					max: fastify.config.rateLimit.logoutLimit,
				},
			},
			schema: {
				response: {
					204: SuccessResponseSchema(z.null()),
					401: ErrorResponseSchema,
				},
				tags: ["Authentication"],
			},
		},
		async (req, reply) => {
			const { sessionValue } = req.getSession();
			if (!sessionValue) {
				throw httpErrors.unauthorized("Unauthorized");
			}

			await fastify.services.authService.logout(sessionValue);

			return reply
				.clearCookie(config.application.sessionCookieName, {
					maxAge: 0,
				})
				.status(204)
				.send({
					statusCode: 204,
					data: null,
				});
		},
	);
};
