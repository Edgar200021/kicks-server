import fp from "fastify-plugin";
import client from "prom-client";

export default fp(async (fastify) => {
	fastify.get("/metrics", { logLevel: "silent" }, async (_, reply) => {
		const metrics = await client.register.metrics();

		return reply
			.status(200)
			.header("content-type", client.register.contentType)
			.send(metrics);
	});
});
