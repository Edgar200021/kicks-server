import fastifyCookie from "@fastify/cookie";
import Fastify from "fastify";
import { describe, expect, it } from "vitest";

describe("Plugins", () => {
	describe("@fastify/cookie", () => {
		it("Should set cookie", async () => {
			const app = Fastify();
			await app.register(fastifyCookie, {});

			app.get("/", (_, reply) =>
				reply
					.status(200)
					.cookie("test", "string", {
						maxAge: 1000,
					})
					.send(),
			);

			const res = await app.inject({ method: "GET", path: "/" });
			const cookie = res.cookies.find((cookie) => cookie.name === "test");

			expect(cookie).toBeDefined();
			expect(cookie?.value).equal("string");
			expect(cookie?.maxAge).equal(1000);
		});

		it("Should remove cookie", async () => {
			const app = Fastify();
			await app.register(fastifyCookie, {});

			app.get("/", (_, reply) =>
				reply
					.status(200)
					.cookie("test", "string", {
						maxAge: 1000,
					})
					.send(),
			);

			app.get("/remove", (_, reply) =>
				reply.status(200).clearCookie("test").send(),
			);
			const setRes = await app.inject({ method: "GET", path: "/" });
			const setCookie = setRes.cookies.find((cookie) => cookie.name === "test");

			expect(setCookie).toBeDefined();
			expect(setCookie?.value).equal("string");

			const res = await app.inject({ method: "GET", path: "/remove" });

			const removedCookie = res.cookies.find(
				(cookie) => cookie.name === "test",
			);

			expect(removedCookie).toBeDefined();
			expect(removedCookie?.value).toBe("");
			expect(removedCookie?.maxAge).toBe(0);
		});
	});
});
