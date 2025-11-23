import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { UserRole } from "@/common/types/db.js";
import { adminUsersRoutesV1 } from "@/features/admin/users/routes/v1.js";

export const adminRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	fastify.addHook("onRequest", async (req, reply) => {
		await req.authenticate(reply);
		await req.authorize([UserRole.Admin]);
	});

	fastify.register(adminUsersRoutesV1, { prefix: "/user" });
};
