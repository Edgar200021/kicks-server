import type { MultipartFile } from "@fastify/multipart";

export const isMultipartFile = (file: unknown): file is MultipartFile => {
	const f = file as MultipartFile;

	return f.file !== undefined && f.type === "file";
};
