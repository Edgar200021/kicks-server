import fp from "fastify-plugin";
import client from "prom-client";

export default fp(async (fastify) => {
	client.collectDefaultMetrics({});

	fastify.get("/metrics", async (_, reply) => {
		const metrics = await client.register.metrics();

		reply
			.status(200)
			.header("content-type", client.register.contentType)
			.send(metrics);
	});
});
