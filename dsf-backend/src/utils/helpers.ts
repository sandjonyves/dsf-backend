import { Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

export const filterObj = (
	obj: Record<string, any>,
	...allowedFields: string[]
): Record<string, any> => {
	const newObj: Record<string, any> = {};
	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el];
	});
	return newObj;
};

export const emailValidator = (email: string) => {
	if (email === null || /^\s*$/.test(email)) return false;
	return String(email)
		.toLowerCase()
		.match(
			/^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/
		);
};

export const fiscalIdValidator = (fiscalId: string) => {
	return String(fiscalId)
		.toLowerCase()
		.match(/^[A-Z]\s*\d{4}\s*\d{4}\s*\d{4}\s*[A-Z]$/gim);
};

export const transformKey = (key: any) => {
	if (!key) return {};
	const { _id, clientId, expirationDate, numberOfdays, hasExpired } = key;
	const { fiscalId, clientName } = clientId;

	return {
		_id,
		clientId: clientId._id,
		fiscalId,
		clientName,
		expirationDate: new Date(expirationDate as string).toLocaleDateString(
			'fr-FR',
			{
				day: 'numeric',
				month: 'numeric',
				year: 'numeric',
			}
		),
		numberOfdays,
		hasExpired,
	};
};

const generateToken = (res: Response, userId: string) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET as Secret, {
		expiresIn: '30d',
		// expiresIn: '2s',
	});

	res.cookie('jwt', token, {
		httpOnly: false,
		secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
		sameSite: 'none', // Prevent CSRF attacks
		maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	});
	return token;
};

export default generateToken;
