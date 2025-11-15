import { httpErrors } from "@fastify/sensible";
import { compare } from "@/common/utils/scrypt.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";
import type { UsersRepository } from "@/features/users/repository/users.repository.js";
import type {
	SignInRequest,
	SignInResponse,
} from "../schemas/sign-in.schema.js";

export const signIn = (usersRepository: UsersRepository) =>
	async function (
		this: AuthService,
		data: SignInRequest,
	): Promise<{ sessionId: string; data: SignInResponse }> {
		const user = await usersRepository.getByEmail(data.email);
		if (!user || !(await compare(data.password, user.password ?? ""))) {
			throw httpErrors.badRequest(`Invalid credentials`);
		}

		if (!user.isVerified || user.isBanned) {
			throw httpErrors.badRequest(
				!user.isVerified ? `Account is not verified` : "User is banned",
			);
		}

		const sessionId = await this.generateSession(user.id);

		return {
			sessionId,
			data: {
				email: user.email,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				gender: user.gender,
			},
		};
	};
