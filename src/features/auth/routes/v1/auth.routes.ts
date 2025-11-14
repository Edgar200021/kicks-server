import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";

export const authRoutesV1: FastifyPluginAsyncZod = async (fastify) => {
	fastify.get(
		"/",
		{
			schema: {
				response: {
					200: z.object({ name: z.string() }),
				},
			},
		},
		async (_, reply) => {
			return reply.status(200).send({ name: "ok" });
		},
	);
};
