import z from "zod";

export const cloudinaryConfigSchema = z.object({
	cloudName: z.string().trim().nonempty(),
	apiKey: z.string().trim().nonempty(),
	apiSecret: z.string().trim().nonempty(),
	folderName: z.string().trim().nonempty(),
});

export type CloudinaryConfig = z.infer<typeof cloudinaryConfigSchema>;
