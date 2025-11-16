import closeWithGrace from "close-with-grace";
import client from "prom-client";
// import "./instrumentation.js";
import { deepFreeze } from "@/common/utils/index.js";
import { buildApp } from "./app.js";
import { setupConfig } from "./config/config.js";

client.collectDefaultMetrics();

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
		host: "0.0.0.0",
		port: config.application.port,
	});
} catch (err) {
	app.log.error(err);
	process.exit(1);
}
