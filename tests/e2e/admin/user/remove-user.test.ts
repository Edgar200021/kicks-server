import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { type UserGender, UserRole } from "../../../../src/common/types/db.js";
import { GET_ALL_USERS_MAX_LIMIT } from "../../../../src/features/admin/user/const/zod.js";
import type { AdminUser } from "../../../../src/features/admin/user/schemas/user.schema.js";
import {
	generatePassword,
	type TestApp,
	withTestApp,
} from "../../../testApp.js";

describe("Admin", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType() as UserGender,
	};

	const setup = async (app: TestApp) => {
		const session = await app.createAdminUser(signUpData);

		const res = await app.getAllUsers({
			headers: new Headers({
				Cookie: session,
			}),
			query: {
				limit: GET_ALL_USERS_MAX_LIMIT,
			},
		});

		expect(res.statusCode).toBe(200);

		const data = await res.body.json();

		return {
			session,
			verifiedUserId: (data.data.users as AdminUser[]).filter(
				(user) => user.isVerified,
			)[0].id,
			notVerifiedUserId: (data.data.users as AdminUser[]).filter(
				(user) => !user.isVerified,
			)[0].id,
		};
	};

	describe("Remove User", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const { notVerifiedUserId, session } = await setup(app);
				await app.blockToggle(notVerifiedUserId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				const res = await app.removeUser(notVerifiedUserId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);
			});
		});

		it("Should be removed from database when request is successful", async () => {
			await withTestApp(async (app) => {
				const { session, notVerifiedUserId } = await setup(app);

				await app.blockToggle(notVerifiedUserId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				const res = await app.removeUser(notVerifiedUserId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(200);

				const dbUser = await app.db
					.selectFrom("users")
					.select("isBanned")
					.where("id", "=", notVerifiedUserId)
					.executeTakeFirst();

				expect(dbUser).toBeUndefined();
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
						const res = await app.removeUser(id as string, {
							headers: new Headers({
								Cookie: session,
							}),
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
					}),
				);
			});
		});

		it("Should return 400 status code when user is not banned", async () => {
			await withTestApp(async (app) => {
				const { notVerifiedUserId, session } = await setup(app);

				const res = await app.removeUser(notVerifiedUserId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 400 when user account was created less than one day ago", async () => {
			await withTestApp(async (app) => {
				const { verifiedUserId, session } = await setup(app);

				const res = await app.removeUser(verifiedUserId, {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(400);
			});
		});

		it("Should return 401 status code user is not authenticated", async () => {
			await withTestApp(async (app) => {
				const res = await app.removeUser(faker.string.uuid(), {});

				expect(res.statusCode).toEqual(401);
			});
		});

		it(`Should return 403 status code user role is not ${UserRole.Admin}`, async () => {
			await withTestApp(async (app) => {
				const session = await app.createAndSignIn({
					body: JSON.stringify(signUpData),
				});

				const res = await app.removeUser(faker.string.uuid(), {
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

				const res = await app.removeUser(faker.string.uuid(), {
					headers: new Headers({
						Cookie: session,
					}),
				});

				expect(res.statusCode).toBe(404);
			});
		});
	});
});
