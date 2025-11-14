import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.js";
import { setupConfig } from "./config/config.js";
import "./instrumentation.js";
import { deepFreeze } from "./utils/utils.js";

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
