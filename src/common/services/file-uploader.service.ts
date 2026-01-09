import { randomUUID } from "node:crypto";
import path from "node:path";
import type { MultipartFile } from "@fastify/multipart";
import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";
import { isMultipartFile } from "@/common/types/mutipart.js";
import type { CloudinaryConfig } from "@/config/cloudinary.js";

export class FileUploaderService {
	private readonly baseOptions: Partial<UploadApiOptions>;

	constructor(config: CloudinaryConfig) {
		cloudinary.config({
			cloud_name: config.cloudName,
			api_key: config.apiKey,
			api_secret: config.apiSecret,
		});
		this.baseOptions = {
			folder: config.folderName,
			use_filename: true,
		};
	}

	async upload(
		file: Buffer | File | MultipartFile,
		options?: UploadApiOptions,
	): Promise<{ fileUrl: string; fileId: string; fileName: string }> {
		const f =
			file instanceof File
				? Buffer.from(await file.arrayBuffer())
				: isMultipartFile(file)
					? Buffer.from(await file.toBuffer())
					: file;

		return new Promise((res, rej) => {
			const publicId = randomUUID().toString();

			cloudinary.uploader
				.upload_stream(
					{
						...options,
						...this.baseOptions,
						...(file instanceof File || isMultipartFile(file)
							? this.getAdditionalOptions(file)
							: {}),
						public_id: publicId,
					},
					(err, result) => {
						if (err || !result) {
							return rej(err ?? new Error("Failed to upload file"));
						}

						return res({
							fileUrl: result.secure_url,
							fileId: result.public_id,
							fileName: result.original_filename,
						});
					},
				)
				.end(f);
		});
	}

	async deleteFile(fileId: string) {
		await cloudinary.uploader.destroy(fileId);
	}

	private getAdditionalOptions(
		file: File | MultipartFile,
	): Pick<UploadApiOptions, "filename_override" | "format" | "resource_type"> {
		const isInstanceofFile = file instanceof File;

		return {
			filename_override: isInstanceofFile ? file.name : file.filename,
			format: path
				.extname(isInstanceofFile ? file.name : file.filename)
				.slice(1),
			resource_type: (isInstanceofFile ? file.type : file.mimetype).startsWith(
				"video",
			)
				? "video"
				: [
							"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
							"text/plain",
							"application/zip",
							"application/vnd.ms-powerpoint",
							"application/vnd.ms-excel",
							"application/msword",
						].includes(file.type)
					? "raw"
					: "auto",
		};
	}
}
