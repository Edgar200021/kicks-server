import { assert, test } from "vitest";
import { compare, scryptHash } from "../../src/common/utils/index.js";

test("scrypt works standalone", async () => {
	const password = "test_password";

	const hash = await scryptHash(password);
	assert.ok(typeof hash === "string");

	const isValid = await compare(password, hash);
	assert.ok(isValid, "compare should return true for correct password");

	const isInvalid = await compare("wrong_password", hash);
	assert.ok(!isInvalid, "compare should return false for incorrect password");
});
