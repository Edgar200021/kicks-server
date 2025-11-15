import closeWithGrace from "close-with-grace";
import client from "prom-client";
import { buildApp } from "./app.js";
// import "./instrumentation.js";
import { deepFreeze } from "@/common/utils/index.js";
import { setupConfig } from "./config/config.js";

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const config = setupConfig();
deepFreeze(config);

const app = await buildApp(config);

closeWithGrace({ delay: 500 }, async ({ err, signal }) => {
	if (err) {
		app.log.fatal({ err }, "server closing with error");
	} else {
		app.log.info(`${signal} received, server closing `);
	}

	// app.scheduler.stop();
	await app.close();
});

try {
	await app.listen({
		host: "127.0.0.1",
		port: config.application.port,
	});
} catch (err) {
	app.log.error(err);
	process.exit(1);
}