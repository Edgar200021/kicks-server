import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { SuccessResponseSchema } from "@/common/schemas/success-response.schema.js";
import { UserSchema } from "../../schemas/user.schema.js";

export const usersRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	fastify.addHook("onRequest", async (req, reply) => {
		await req.authenticate(reply);
	});

	fastify.get(
		"/me",
		{
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
};
