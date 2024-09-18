import asyncWrapper from '../middlewares/async';
import { Request, Response, NextFunction } from 'express';
import {
	IKey,
	CreateKey,
	GetKey,
	UpdateKey,
	GetAllKeys,
	DeleteKey,
	DeleteManyKeys,
} from '../models/Key';
import {
	createCustomError,
	createValidationError,
} from '../errors/custom-error';
import { generateKeys } from '../utils/key';
import { GetClient } from '../models/Client';
import { transformKey } from '../utils/helpers';

export const createKey = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { numberOfdays, clientId } = req.body as IKey;

		const targetClient = await GetClient({ _id: clientId });
		if (!targetClient) {
			return next(
				createValidationError('ValidationError', 400, {
					clientId: 'Ce client est introuvable',
				})
			);
		}
		if (numberOfdays < 30) {
			return next(
				createValidationError('ValidationError', 400, {
					numberOfdays: 'Durée minimale de la clé: 30 jours',
				})
			);
		}
		const {
			publicKeyJSONEncrypted: publicKey,
			privateKeyJSONEncrypted: privateKey,
			ivString: secret,
			expirationDate,
		} = generateKeys(numberOfdays);

		let existingKey = await GetKey({ clientId });
		if (existingKey) {
			existingKey.privateKey = privateKey;
			existingKey.publicKey = publicKey;
			(existingKey.iv = secret), (existingKey.expirationDate = expirationDate);
			existingKey.save({ validateModifiedOnly: true });
			const key = await GetKey({ clientId });
			return res.status(200).json({
				status: 'success',
				message: 'Clé mise à jour avec succès',
				data: transformKey(key?.toObject()),
			});
		}
		const key = await CreateKey({
			clientId,
			privateKey,
			publicKey,
			expirationDate,
			numberOfdays,
			iv: secret,
		});
		return res.status(200).json({
			status: 'success',
			message: 'Clé créée avec succès',
			data: transformKey(key?.toObject()),
		});
	}
);

export const getAllKeys = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const keys = await GetAllKeys();
		return res
			.status(200)
			.json({
				status: 'success',
				data: keys.map((key) => transformKey(key?.toObject())),
			});
	}
);

export const getKey = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { id: keyId } = req.params as { id: string };

		if (keyId && keyId.length < 10)
			return next(createCustomError('Clé introuvable', 404));

		const existingKey = await GetKey({ _id: keyId });
		if (!existingKey) {
			return next(createCustomError('Clé introuvable', 404));
		}

		return res.status(200).json({ status: 'success', data: existingKey });
	}
);

export const deleteKey = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { id: keyId } = req.params as { id: string };

		if (keyId === 'many') {
			const keysToDelete = req.body?.data as string[];
			await DeleteManyKeys(keysToDelete);
			return res
				.status(200)
				.json({ status: 'success', message: 'Clés supprimées avec succès' });
		}

		if (keyId && keyId.length < 10)
			return next(createCustomError('Clé introuvable', 404));

		const existingKey = await GetKey({ _id: keyId });
		if (!existingKey) {
			return next(createCustomError('Clé introuvable', 404));
		}

		await DeleteKey({ _id: keyId });

		return res
			.status(200)
			.json({ status: 'success', message: 'Clé supprimé avec succès' });
	}
);
