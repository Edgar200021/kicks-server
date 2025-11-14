import z from "zod";
import {
	FIRST_NAME_MAX_LENGTH,
	FIRST_NAME_MIN_LENGTH,
	LAST_NAME_MAX_LENGTH,
	LAST_NAME_MIN_LENGTH,
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../const/zod.js";

export const SignUpRequestSchema = z.object({
	email: z.email(),
	password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
	firstName: z.string().min(FIRST_NAME_MIN_LENGTH).max(FIRST_NAME_MAX_LENGTH),
	lastName: z.string().min(LAST_NAME_MIN_LENGTH).max(LAST_NAME_MAX_LENGTH),
	gender: z.literal(["male", "female", "other"]),
});

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
