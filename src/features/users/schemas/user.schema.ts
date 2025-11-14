import z from "zod";
import { UserGender } from "@/common/types/db.js";

export const UserSchema = z.object({
	email: z.email().nonempty(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	gender: z.enum(UserGender).nullable(),
});

export type User = z.infer<typeof UserSchema>;
