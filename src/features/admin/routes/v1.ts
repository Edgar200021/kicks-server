import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { UserRole } from "@/common/types/db.js";
import { adminBrandRoutesV1 } from "@/features/admin/brand/routes/v1.js";
import { adminCategoryRoutesV1 } from "@/features/admin/category/routes/v1.js";
import { adminProductRoutesV1 } from "@/features/admin/product/routes/v1.js";
import { adminUsersRoutesV1 } from "@/features/admin/user/routes/v1.js";

export const adminRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	fastify.addHook("onRequest", async (req, reply) => {
		await req.authenticate(reply);
		await req.authorize([UserRole.Admin]);
	});

	fastify.register(adminUsersRoutesV1, { prefix: "/user" });
	fastify.register(adminCategoryRoutesV1, { prefix: "/category" });
	fastify.register(adminBrandRoutesV1, { prefix: "/brand" });
	fastify.register(adminProductRoutesV1, { prefix: "/product" });
};
