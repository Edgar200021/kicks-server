import type { Redis } from "ioredis";
import type { Kysely } from "kysely";
import type { Transporter } from "nodemailer";
import type { ToadScheduler } from "toad-scheduler";
import { EmailService } from "@/common/services/email.service.js";
import { OAuth2Service } from "@/common/services/oauth2.service.js";
import type { DB } from "@/common/types/db.js";
import type { ApplicationConfig } from "@/config/config.js";
import { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";
import { AdminCategoryService } from "@/features/admin/category/service/admin-category.service.js";
import { AdminUserRepository } from "@/features/admin/user/repository/admin-user.repository.js";
import { AdminUserService } from "@/features/admin/user/service/admin-users.service.js";
import { AuthService } from "@/features/auth/service/auth.service.js";
import { UserRepository } from "@/features/user/repository/user.repository.js";
import { UserService } from "@/features/user/service/user.service.js";

declare module "fastify" {
	interface FastifyInstance {
		services: {
			authService: AuthService;
			userService: UserService;
			adminUserService: AdminUserService;
			adminCategoryService: AdminCategoryService;
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
	const userRepository = new UserRepository(db);
	const adminUserRepository = new AdminUserRepository(db);
	const adminCategoryRepository = new AdminCategoryRepository(db);

	const emailService = new EmailService(transporter, config);
	const oauth2Service = new OAuth2Service(config);

	const services = {
		authService: new AuthService(
			userRepository,
			emailService,
			oauth2Service,
			redis,
			config,
		),
		userService: new UserService(userRepository, scheduler),
		adminUserService: new AdminUserService(adminUserRepository),
		adminCategoryService: new AdminCategoryService(adminCategoryRepository),
	};

	return services;
};
