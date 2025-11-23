import { faker } from "@faker-js/faker";
import { Headers } from "undici";
import { describe, expect, it } from "vitest";
import { GET_ALL_USERS_SEARCH_MAX_LENGTH } from "../../../../src/features/admin/users/const/zod";
import { generatePassword, withTestApp } from "../../../testApp.js";

describe("Authentication", () => {
	const signUpData = {
		email: faker.internet.email(),
		password: generatePassword(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		gender: faker.person.sexType(),
	};

	describe("Reset Password", () => {
		it("Should return 200 status code when request is successful", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const res = await app.getAllUsers({
					headers: new Headers({
						Cookie: session,
					}),
				});

				const data = await res.body.json();

				expect(res.statusCode).toBe(200);
				expect(data.data).toHaveProperty("pageCount");
				expect(data.data.pageCount).toBeTypeOf("number");
				expect(data.data).toHaveProperty("users");
				expect(data.data.users).toBeInstanceOf(Array);
			});
		});

		it("Should return 400 status code when data is invalid", async () => {
			await withTestApp(async (app) => {
				const session = await app.createAdminUser(signUpData);

				const testCases = [
					{
						name: "page is negative",
						data: {
							page: -1,
						},
					},
					{
						name: "page is zero",
						data: {
							page: 0,
						},
					},
					{
						name: "limit is negative",
						data: {
							limit: -1,
						},
					},
					{
						name: "limit is zero",
						data: {
							limit: 0,
						},
					},
					{
						name: "isBanned is not boolean",
						data: {
							isBanned: "invalid value",
						},
					},
					{
						name: "isVerified is not boolean",
						data: {
							isVerified: "invalid value",
						},
					},
					{
						name: "invalid gender",
						data: {
							gender: "invalid gender",
						},
					},
					{
						name: "search is too long",
						data: {
							search: faker.string.alpha({
								length: GET_ALL_USERS_SEARCH_MAX_LENGTH + 1,
							}),
						},
					},
				];

				await Promise.all(
					testCases.map(async ({ name, data }) => {
						const res = await app.getAllUsers({
							headers: new Headers({
								Cookie: session,
							}),
							query: data,
						});

						expect(res.statusCode, `${name} → wrong status`).toBe(400);
					}),
				);
			});
		});
	});
});
