export type DatabaseError = {
	detail: string;
	code: string;
	constraint: string;
};

export const isDatabaseError = (err: unknown): err is DatabaseError => {
	const error = err as DatabaseError;

	return (
		error.detail !== undefined &&
		error.code !== undefined &&
		error.constraint !== undefined
	);
};
