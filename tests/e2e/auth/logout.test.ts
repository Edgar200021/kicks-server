import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { generatePassword, withTestApp } from "../../testApp.js";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	describe("Logout", () => {
		it("Should return 204 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const cookie = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.logout({
					headers: new Headers({
						Cookie: cookie,
					}),
				});

				expect(res.statusCode).toEqual(204);
			});
		});

		it("Session should be deleted from cookie and redis when request is successful", async () => {
			await withTestApp(async (app) => {
				const cookie = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.logout({
					headers: new Headers({
						Cookie: cookie,
					}),
				});
				expect(res.statusCode).toEqual(204);

				const redisSession = await app.getRedisToken("session");
				expect(redisSession).toBeUndefined();

				const cookieHeader = res.headers["set-cookie"];
				expect(cookieHeader).toBeDefined();

				const cookies = Array.isArray(cookieHeader)
					? cookieHeader
					: [cookieHeader];

				const sessionCookie = cookies.find((c) =>
					c.startsWith(`${app.applicationConfig.sessionCookieName}=`),
				);
				expect(sessionCookie).toBeDefined();

				const maxAgeMatch = sessionCookie.match(/Max-Age=(\d+)/i);
				expect(maxAgeMatch).toBeTruthy();
				expect(+maxAgeMatch[1]).toEqual(0);
			});
		});

		it("Should return 401 status code user is not authorized", async () => {
			await withTestApp(async (app) => {
				const res = await app.logout({});

				expect(res.statusCode).toEqual(401);
			});
		});
	});
});
