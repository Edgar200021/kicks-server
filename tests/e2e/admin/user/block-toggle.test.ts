import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { UserRole } from "../../../../src/common/types/db.js";
import {
	generatePassword,
	type TestApp,
	withTestApp,
} from "../../../testApp.js";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	const setup = async (app: TestApp) => {
		const userIds = await app.db
			.selectFrom("users")
			.select("id")
			.limit(1)
			.execute();

		return userIds[0].id;
	};

	describe("Reset Password", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const userId = await setup(app);

				const res = await app.blockToggle(userId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);
			});
		});

		it("Should save changes into database when request is successfull", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const userId = await setup(app);

				const res = await app.blockToggle(userId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);

				const dbUser = await app.db
					.selectFrom("users")
					.select("isBanned")
					.where("id", "=", userId)
					.executeTakeFirstOrThrow();

				expect(dbUser.isBanned).toBeTruthy();

				await app.blockToggle(userId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(
					(
						await app.db
							.selectFrom("users")
							.select("isBanned")
							.where("id", "=", userId)
							.executeTakeFirstOrThrow()
					).isBanned,
				).toBeFalsy();
			});
		});

		it("Should return 400 status code when userId is invalid", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const testCases = [
					{
						name: "id is number",
						id: 12341,
					},
					{
						name: "non uuid",
						id: "someid",
					},
				];

				await Promise.all(
					testCases.map(async ({ name, id }) => {
						const res = await app.blockToggle(id as string, {
							headers: new Headers({
								Cookie: session,
							}),
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
					}),
				);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.blockToggle(faker.string.uuid(), {});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.blockToggle(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toEqual(403);
			});
		});

		it("Should return 404 status code when user is not found", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.blockToggle(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});
