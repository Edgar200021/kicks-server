import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const usersRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	fastify.addHook("onRequest", async (req, reply) => {
		await req.authenticate(reply);
	});
};
