import { httpErrors } from "@fastify/sensible";
import type { Transporter } from "nodemailer";
import type { ApplicationConfig } from "@/config/config.js";

export type EmailService = ReturnType<typeof createEmailService>;

export const createEmailService = (
	mailer: Transporter,
	config: ApplicationConfig,
) => {
	return {
		async sendVerificationEmail(
			to: string,
			token: string,
			onError?: (err: unknown) => void,
		) {
			const subject = "Email Verification";
			const url = `${config.clientUrl}${config.clientAccountVerificationPath}?token=${encodeURIComponent(token)}`;

			const text = `Please click the link to verify your email: ${url}`;
			const html = `<p>Please click the link to verify your email: <a href="${url}">${url}</a></p>`;

			try {
				await mailer.sendMail({
					to,
					subject,
					text,
					html,
				});
			} catch (error) {
				onError?.(error);
				throw httpErrors.internalServerError(
					"Failed to send verification email",
				);
			}
		},

		async sendResetPasswordEmail(
			to: string,
			token: string,
			onError?: (err: unknown) => void,
		) {
			const subject = "Password Reset";
			const url = `${config.clientUrl}${config.clientResetPasswordPath}?token=${encodeURIComponent(token)}`;

			const text = `Please click the link to reset your password: ${url}`;
			const html = `<p>Please click the link to reset your password: <a href="${url}">${url}</a></p>`;

			try {
				await mailer.sendMail({
					to,
					subject,
					text,
					html,
				});
			} catch (error) {
				onError?.(error);
				throw httpErrors.internalServerError(
					"Failed to send verification email",
				);
			}
		},
	};
};
