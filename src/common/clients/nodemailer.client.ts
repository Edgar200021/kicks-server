import { createTransport, type Transporter } from "nodemailer";
import type { MailerConfig } from "@/config/mailer.config.js";

export const setupNodemailerClient = ({
	host,
	port,
	user,
	password: pass,
	secure,
}: MailerConfig): Promise<Transporter> => {
	const transporter = createTransport({
		host,
		port,
		auth: {
			user,
			pass,
		},
		secure,
	});

	return new Promise((resolve, reject) => {
		transporter.verify((err) => {
			if (err) {
				reject(err);
				return;
			}

			resolve(transporter);
		});
	});
};
