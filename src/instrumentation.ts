/*instrumentation.ts*/

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
	ConsoleMetricExporter,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
	resource: resourceFromAttributes({
		[ATTR_SERVICE_NAME]: "Kicks API",
		[ATTR_SERVICE_VERSION]: "1.0",
	}),
	traceExporter: new ConsoleSpanExporter(),
	metricReader: new PeriodicExportingMetricReader({
		exporter: new ConsoleMetricExporter(),
	}),
	instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
