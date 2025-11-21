import { httpErrors } from "@fastify/sensible";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import type { Selectable } from "kysely";
import { OAUTH_COOKIE_SESSION_PREFIX } from "@/common/const/cookie.js";
import type { Nullable } from "@/common/types/common.js";
import type { Users } from "@/common/types/db.js";

declare module "fastify" {
	export interface FastifyRequest {
		getSession: ReturnType<typeof getSession>;
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

function getSession(instance: FastifyInstance) {
	return function getSession(this: FastifyRequest) {
		let sessionValue: string | undefined;
		let isOauth = false;

		const session = this.cookies[instance.config.application.sessionCookieName];

		if (session) {
			const unsigned = this.unsignCookie(session);
			if (!unsigned.valid) {
				throw instance.httpErrors.unauthorized("Unauthorized");
			}

			const [_, oauthSession] = unsigned.value.split(
				OAUTH_COOKIE_SESSION_PREFIX,
			);

			sessionValue = oauthSession || unsigned.value;
			isOauth = !!oauthSession;
		}

		return { sessionValue, isOauth };
	};
}

function authenticate(instance: FastifyInstance) {
	const { sessionTTLMinutes, oauthSessionTtlMinutes, sessionCookieName } =
		instance.config.application;

	return async function (this: FastifyRequest, reply: FastifyReply) {
		const { sessionValue, isOauth } = this.getSession();
		if (!sessionValue) {
			throw instance.httpErrors.unauthorized("Unauthorized");
		}

		const { id, email, firstName, role, lastName, gender } =
			await instance.services.authService.authenticate(
				sessionValue,
				!isOauth ? "regular" : "oauth2",
			);

		const ttl = !isOauth ? sessionTTLMinutes : oauthSessionTtlMinutes;
		const cookieName = !isOauth
			? sessionCookieName
			: `${OAUTH_COOKIE_SESSION_PREFIX}${sessionCookieName}`;

		reply.setCookie(cookieName, sessionValue, {
			maxAge: ttl * 60,
		});

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

	fastify.decorateRequest("getSession", getSession(fastify));
	fastify.decorateRequest("authenticate", authenticate(fastify));
	fastify.decorateRequest("authorize", authorize);
});
