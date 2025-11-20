import z from "zod";
import { UserGender } from "@/common/types/db.js";
import { passwordSchema } from "@/features/auth/schemas/password.schema.js";
import {
	FIRST_NAME_MAX_LENGTH,
	FIRST_NAME_MIN_LENGTH,
	LAST_NAME_MAX_LENGTH,
	LAST_NAME_MIN_LENGTH,
} from "../const/zod.js";

export const SignUpRequestSchema = z.object({
	email: z.email().nonempty(),
	password: passwordSchema,
	firstName: z.string().min(FIRST_NAME_MIN_LENGTH).max(FIRST_NAME_MAX_LENGTH),
	lastName: z.string().min(LAST_NAME_MIN_LENGTH).max(LAST_NAME_MAX_LENGTH),
	gender: z.enum(UserGender),
});

export const SignUpResponseSchema = z.string();

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
