import { httpErrors } from "@fastify/sensible";
import type { AdminUsersService } from "@/features/admin/users/service/admin-users.service.js";
import type { BlockToggleRequestParams } from "../schemas/block-toggle.schema.js";

export async function blockToggle(
	this: AdminUsersService,
	params: BlockToggleRequestParams,
) {
	const userId = await this.usersRepository.blockToggle(params.id);
	if (!userId) {
		throw httpErrors.notFound(`User with id ${params.id} doesn't exist`);
	}
}
