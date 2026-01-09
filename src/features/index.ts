import type { FastifyInstance } from "fastify";
import type { Redis } from "ioredis";
import type { Kysely } from "kysely";
import type { Transporter } from "nodemailer";
import type { ToadScheduler } from "toad-scheduler";
import { EmailService } from "@/common/services/email.service.js";
import { FileUploaderService } from "@/common/services/file-uploader.service.js";
import { OAuth2Service } from "@/common/services/oauth2.service.js";
import type { DB } from "@/common/types/db.js";
import type { CloudinaryConfig } from "@/config/cloudinary.js";
import type { ApplicationConfig } from "@/config/config.js";
import { AdminBrandRepository } from "@/features/admin/brand/repository/admin-brand.repository.js";
import { AdminBrandService } from "@/features/admin/brand/service/admin-brand.service.js";
import { AdminCategoryRepository } from "@/features/admin/category/repository/admin-category.repository.js";
import { AdminCategoryService } from "@/features/admin/category/service/admin-category.service.js";
import { AdminProductRepository } from "@/features/admin/product/repository/admin-product.repository.js";
import { AdminProductService } from "@/features/admin/product/service/admin-product.service.js";
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
			adminBrandService: AdminBrandService;
			adminProductService: AdminProductService;
		};
	}
}

export const setupServices = ({
	db,
	transporter,
	redis,
	appConfig,
	cloudinaryConfig,
	scheduler,
}: {
	db: Kysely<DB>;
	transporter: Transporter;
	redis: Redis;
	appConfig: ApplicationConfig;
	cloudinaryConfig: CloudinaryConfig;
	scheduler: ToadScheduler;
}): FastifyInstance["services"] => {
	const userRepository = new UserRepository(db);

	const adminUserRepository = new AdminUserRepository(db);
	const adminCategoryRepository = new AdminCategoryRepository(db);
	const adminBrandRepository = new AdminBrandRepository(db);
	const adminProductRepository = new AdminProductRepository(db);

	const emailService = new EmailService(transporter, appConfig);
	const oauth2Service = new OAuth2Service(appConfig);
	const fileUploader = new FileUploaderService(cloudinaryConfig);

	return {
		authService: new AuthService(
			userRepository,
			emailService,
			oauth2Service,
			redis,
			appConfig,
		),
		userService: new UserService(userRepository, scheduler),
		adminUserService: new AdminUserService(adminUserRepository),
		adminCategoryService: new AdminCategoryService(adminCategoryRepository),
		adminBrandService: new AdminBrandService(adminBrandRepository),
		adminProductService: new AdminProductService(
			adminProductRepository,
			fileUploader,
		),
	};
};
