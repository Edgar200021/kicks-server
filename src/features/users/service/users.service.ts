import type { UsersRepository } from "../repository/users.repository.js";

export type UsersService = ReturnType<typeof createUsersService>;

export const createUsersService = (repository: UsersRepository) => {};
