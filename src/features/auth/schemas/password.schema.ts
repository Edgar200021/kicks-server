import z from "zod";
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from "@/features/auth/const/zod.js";

export const passwordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, {
		message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
	})
	.max(PASSWORD_MAX_LENGTH, {
		message: `Password must be no longer than ${PASSWORD_MAX_LENGTH} characters`,
	})
	.refine((password) => /[A-Z]/.test(password), {
		message: "Password must contain at least one uppercase letter",
	})
	.refine((password) => /[a-z]/.test(password), {
		message: "Password must contain at least one lowercase letter",
	})
	.refine((password) => /[0-9]/.test(password), {
		message: "Password must contain at least one digit",
	})
	.refine((password) => /[!@#$%^&*]/.test(password), {
		message: "Password must contain at least one special character (!@#$%^&*)",
	});
