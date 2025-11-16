import type { UsersRepository } from "../repository/users.repository.js";

export class UserService {
	constructor(readonly usersRepository: UsersRepository) {}
}
