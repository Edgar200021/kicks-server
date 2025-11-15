import { httpErrors } from "@fastify/sensible";
import { compare } from "@/common/utils/scrypt.js";
import type { AuthService } from "@/features/auth/service/auth.service.js";
import type {
	SignInRequest,
	SignInResponse,
} from "../schemas/sign-in.schema.js";

export async function signIn(
	this: AuthService,
	data: SignInRequest,
): Promise<{ sessionId: string; data: SignInResponse }> {
	const user = await this.usersRepository.getByEmail(data.email);
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
}
