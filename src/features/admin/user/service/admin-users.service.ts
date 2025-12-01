import type { AdminUserRepository } from "@/features/admin/user/repository/admin-user.repository.js";
import { blockToggle } from "@/features/admin/user/service/block-toggle.js";
import { getAll } from "@/features/admin/user/service/get-all.js";
import { remove } from "@/features/admin/user/service/remove.js";

export class AdminUserService {
	getAll = getAll;
	remove = remove;
	blockToggle = blockToggle;

	constructor(protected readonly userRepository: AdminUserRepository) {}
}
