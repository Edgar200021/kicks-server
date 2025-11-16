import { httpErrors } from "@fastify/sensible";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { Selectable } from "kysely";
import type { Nullable } from "@/common/types/common.js";
import type { Users } from "@/common/types/db.js";

declare module "fastify" {
	export interface FastifyRequest {
		authenticate: ReturnType<typeof authenticate>;
		authorize: typeof authorize;
		user: Nullable<
			Pick<
				Selectable<Users>,
				"id" | "email" | "firstName" | "lastName" | "role" | "gender"
			>
		>;
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

		const { id, email, firstName, role, lastName, gender } =
			await instance.services.authService.authenticate(unsigned.value);

		reply.setCookie(
			instance.config.application.sessionCookieName,
			unsigned.value,
			{
				maxAge: instance.config.application.sessionTTLMinutes * 60,
			},
		);

		this.user = {
			id,
			email,
			role,
			firstName,
			lastName,
			gender,
		};
	};
}

async function authorize(
	this: FastifyRequest,
	roles: Selectable<Users>["role"][],
) {
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
