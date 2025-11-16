import { httpErrors } from "@fastify/sensible";
import type { Transporter } from "nodemailer";
import type { ApplicationConfig } from "@/config/config.js";

export class EmailService {
	constructor(
		private readonly mailer: Transporter,
		private readonly config: ApplicationConfig,
	) {}

	async sendVerificationEmail(
		to: string,
		token: string,
		onError?: (err: unknown) => void,
	) {
		const subject = "Email Verification";
		const url = `${this.config.clientUrl}${this.config.clientAccountVerificationPath}?token=${encodeURIComponent(token)}`;

		const text = `Please click the link to verify your email: ${url}`;
		const html = `<p>Please click the link to verify your email: <a href="${url}">${url}</a></p>`;

		try {
			await this.mailer.sendMail({
				to,
				subject,
				text,
				html,
			});
		} catch (error) {
			onError?.(error);
			throw httpErrors.internalServerError("Failed to send verification email");
		}
	}

	async sendResetPasswordEmail(
		to: string,
		token: string,
		onError?: (err: unknown) => void,
	) {
		const subject = "Password Reset";
		const url = `${this.config.clientUrl}${this.config.clientResetPasswordPath}?token=${encodeURIComponent(token)}`;

		const text = `Please click the link to reset your password: ${url}`;
		const html = `<p>Please click the link to reset your password: <a href="${url}">${url}</a></p>`;

		try {
			await this.mailer.sendMail({
				to,
				subject,
				text,
				html,
			});
		} catch (error) {
			onError?.(error);
			throw httpErrors.internalServerError("Failed to send verification email");
		}
	}
}
