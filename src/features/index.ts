import type { Redis } from "ioredis";
import type { Kysely } from "kysely";
import type { Transporter } from "nodemailer";
import type { ToadScheduler } from "toad-scheduler";
import { EmailService } from "@/common/services/email.service.js";
import { OAuth2Service } from "@/common/services/oauth2.service.js";
import type { DB } from "@/common/types/db.js";
import type { ApplicationConfig } from "@/config/config.js";
import { AdminUsersRepository } from "@/features/admin/users/repository/users.repository.js";
import { AdminUsersService } from "@/features/admin/users/service/admin-users.service.js";
import { AuthService } from "@/features/auth/service/auth.service.js";
import { UsersRepository } from "@/features/users/repository/users.repository.js";
import { UsersService } from "@/features/users/service/users.service.js";

declare module "fastify" {
	interface FastifyInstance {
		services: {
			authService: AuthService;
			usersService: UsersService;
			adminUsersService: AdminUsersService;
		};
	}
}

export const setupServices = ({
	db,
	transporter,
	redis,
	config,
	scheduler,
}: {
	db: Kysely<DB>;
	transporter: Transporter;
	redis: Redis;
	config: ApplicationConfig;
	scheduler: ToadScheduler;
}) => {
	const usersRepository = new UsersRepository(db);
	const adminUsersRepository = new AdminUsersRepository(db);

	const emailService = new EmailService(transporter, config);
	const oauth2Service = new OAuth2Service(config);

	const services = {
		authService: new AuthService(
			usersRepository,
			emailService,
			oauth2Service,
			redis,
			config,
		),
		usersService: new UsersService(usersRepository, scheduler),
		adminUsersService: new AdminUsersService(adminUsersRepository),
	};

	return services;
};
