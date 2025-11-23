import z from "zod";

export const PageCountSchema = z.object({ pageCount: z.number().gte(0) });
