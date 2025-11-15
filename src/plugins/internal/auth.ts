import { httpErrors } from "@fastify/sensible";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { Nullable } from "@/common/types/common.js";
import type { User } from "@/features/users/schemas/user.schema.js";

declare module "fastify" {
	export interface FastifyRequest {
		authenticate: ReturnType<typeof authenticate>;
		authorize: typeof authorize;
		user: Nullable<User>;
	}
}

function authenticate(instance: FastifyInstance) {
	return async function (this: FastifyRequest, reply: FastifyReply) {
		const session = this.cookies[instance.config.application.sessionCookieName];

		if (!session) {
			throw httpErrors.unauthorized("Unauthorized");
		}

		const unsigned = this.unsignCookie(session);
		if (!unsigned.valid) {
			throw instance.httpErrors.unauthorized("Unauthorized");
		}

		const { email, firstName, role, lastName, gender } =
			await instance.services.authService.authenticate(unsigned.value);

		reply.setCookie(
			instance.config.application.sessionCookieName,
			unsigned.value,
			{
				maxAge: instance.config.application.sessionTTLMinutes * 60,
			},
		);

		this.user = {
			email,
			role,
			firstName,
			lastName,
			gender,
		};
	};
}

async function authorize(this: FastifyRequest, roles: User["role"][]) {
	if (!this.user) {
		throw httpErrors.unauthorized("Unauthorized");
	}

	if (!roles.includes(this.user.role)) {
		throw httpErrors.forbidden("Access denied");
	}
}

export default fp(async (fastify) => {
	fastify.decorateRequest("user", null);
	fastify.addHook("onRequest", async (req) => {
		req.user = null;
	});
	fastify.decorateRequest("authenticate", authenticate(fastify));
	fastify.decorateRequest("authorize", authorize);
});
