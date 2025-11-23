import { randomBytes } from "node:crypto";

export const generateToken = (bytesNum: number = 32) => {
	return randomBytes(bytesNum).toString("hex");
};
