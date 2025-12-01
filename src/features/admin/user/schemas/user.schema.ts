import z from "zod";
import { UserGender, UserRole } from "@/common/types/db.js";

export const AdminUserSchema = z.object({
	id: z.uuid().nonempty(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	email: z.email().nonempty(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	gender: z.enum(UserGender).nullable(),
	role: z.enum(UserRole),
	isBanned: z.boolean(),
	isVerified: z.boolean(),
	facebookId: z.string().nullable(),
	googleId: z.string().nullable(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;
