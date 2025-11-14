export const deepFreeze = (
	o: Record<string, Record<string, unknown> | unknown>,
) => {
	Object.freeze(o);
	if (o === undefined || o === null) {
		return o;
	}

	for (const prop of Object.getOwnPropertyNames(o)) {
		if (
			o[prop] !== null &&
			(typeof o[prop] === "object" || typeof o[prop] === "function") &&
			!Object.isFrozen(o[prop])
		) {
			//@ts-expect-error
			deepFreeze(o[prop]);
		}
	}

	return o;
};
