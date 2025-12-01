import { httpErrors } from "@fastify/sensible";
import type { AdminUserService } from "@/features/admin/user/service/admin-users.service.js";
import type { BlockToggleRequestParams } from "../schemas/block-toggle.schema.js";

export async function blockToggle(
	this: AdminUserService,
	params: BlockToggleRequestParams,
) {
	const userId = await this.userRepository.blockToggle(params.id);
	if (!userId) {
		throw httpErrors.notFound(`User with id ${params.id} doesn't exist`);
	}
}
