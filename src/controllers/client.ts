import asyncWrapper from '../middlewares/async';
import { Request, Response, NextFunction } from 'express';
import otpGenerator from 'otp-generator';

import {
	IClient,
	CreateClient,
	GetClient,
	UpdateClient,
	GetAllClients,
	DeleteClient,
	DeleteManyClients,
	Client,
} from '../models/Client';
import {
	createCustomError,
	createValidationError,
} from '../errors/custom-error';
import generateToken from '../utils/helpers';
import { EmailOptions, sendEmail } from '../services/mailer';
import {  CustomRequestClient } from '../types';
import { DeleteKey, GetKey } from '../models/Key';

export const createClient = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { email, tel, fiscalId, clientName, dbUrl } =
			req.body as IClient;

		const existingClient = await GetClient({ email });
		if (existingClient) {
			return next(
				createValidationError('ValidationError', 400, {
					fiscalId: 'Cet id fiscal est déjà associé à un client',
				})
			);
		}
		const client = await CreateClient({
			email,
			tel,
			fiscalId,
			clientName,
			dbUrl,
		});
		return res.status(200).json({
			status: 'success',
			message: 'Client ajouté avec succès',
			data: client,
			// data: {
			// 	"_id":"6823237928372932",
			// 	"clientName": "Finance",
			// 	"fiscalId":"A 0000 0000 0000 A",
			// 	"tel":"+237 670 755 444"
			// },
		});
	}
);

export const updateClient = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { id: clientId } = req.params as { id: string };
		if (clientId && clientId.length < 10)
			return next(createCustomError('Client introuvable', 404));

		const clientDataToUpdate = req.body as Partial<IClient>;

		const existingClient = await GetClient({ _id: clientId });
		if (!existingClient) {
			return next(createCustomError('Client introuvable', 404));
		}

		const updatedClient = await UpdateClient(clientId, clientDataToUpdate);

		if (!updatedClient) {
			return next(createCustomError('La mise à jour a échoué', 404));
		}

		return res.status(200).json({
			status: 'success',
			message: 'Mise à jour réussie',
			data: updatedClient,
		});
	}
);

export const getAllClients = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const clients = await GetAllClients();
		return res.status(200).json({ status: 'success', data: clients });
	}
);

export const getClient = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { id: clientId } = req.params as { id: string };

		if (clientId && clientId.length < 10)
			return next(createCustomError('Client introuvable', 404));

		const existingClient = await GetClient({ _id: clientId });
		if (!existingClient) {
			return next(createCustomError('Client introuvable', 404));
		}

		return res.status(200).json({ status: 'success', data: existingClient });
	}
);

export const deleteClient = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { id: clientId } = req.params as { id: string };

		if (clientId === 'many') {
			const clientsToDelete = req.body?.data as string[];
			await DeleteManyClients(clientsToDelete);
			return res
				.status(200)
				.json({ status: 'success', message: 'Clients supprimés avec succès' });
		}

		if (clientId && clientId.length < 10)
			return next(createCustomError('Client introuvable', 404));

		const existingClient = await GetClient({ _id: clientId });
		if (!existingClient) {
			return next(createCustomError('Client introuvable', 404));
		}

		await DeleteClient({ _id: clientId });
		await DeleteKey({clientId})

		return res
			.status(200)
			.json({ status: 'success', message: 'Client supprimé avec succès' });
	}
);

export const sendOTP = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { email, fiscalId } = req.body as IClient;
		let client = await GetClient({ email: email });
		if (!client) {
			return next(createCustomError('Client introuvable', 404));
		}
		const newOtp = otpGenerator.generate(6, {
			lowerCaseAlphabets: false,
			upperCaseAlphabets: false,
			specialChars: false,
		});

		const otpExpiryTime = Date.now() + 10 * 60 * 1000; //10 min after otp is sent

		client = await Client.findByIdAndUpdate(client._id, {
			otp: newOtp,
			otpExpiryTime: otpExpiryTime,
		});
		if (!client) {
			return next(createCustomError("L'opération a échouée", 400));
		}
		// send mail
		const emailOptions: EmailOptions = {
			to: client?.email as string,
			subject: 'OTP - DSF-Gen ',
			html: `Votre mot de passe à usage unique est ${newOtp}. Il a une durée de 10 mins`,
		};
		console.log(newOtp);
		sendEmail(emailOptions);

		res.status(200).json({
			status: 'success',
			message: `Un mot de passe a été envoyé à l'adresse ( ${client.email} )`,
		});
	}
);

export const verifyOTP = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { email, otp }: { email: string; otp: string } = req.body;

		const client = await Client.findOne({
			email: email,
		});

		if (!client) {
			return next(createCustomError('Compte introuvable', 404));
		}


		if (client.otpExpiryTime.getTime() <= Date.now()) {
			return res.status(400).json({
				status: 'error',
				message: 'Le mot de passe a expiré',
			});
		}
		if (!(await client?.correctOTP(otp, client?.otp))) {
			return res.status(400).json({
				status: 'error',
				message: 'Le code entré est incorrect',
			});
		}
		//OTP is correct

		client.otp = undefined;

		await client.save({ validateModifiedOnly: true });
		const token = generateToken(res, client._id as string);

		res.status(200).json({
			status: 'success',
			message: 'Connexion reussie',
			data: {
				_id: client._id,
				email: client.email,
				token
			},
		});
	}
);

export const getRemoteDb = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { user:client  } = req as CustomRequestClient

		if (!client) {
			return next(
				createCustomError('Votre compte est introuvable', 400)
			);
		}
		res.status(200).json({
			status: 'success',
			message: 'Operation réussie',
			data: client.dbUrl || null,
			
		});
	}
);

export const getActivationKey = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { user:client  } = req as CustomRequestClient

		if (!client) {
			return next(
				createCustomError('Votre compte est introuvable', 400)
				);
			}
		const activationKey = await GetKey({clientId:client._id?.toString()}, true);
		if(!activationKey){
			return next(createCustomError("Aucune clé définie pour cet utilisateur",404))
		}

		res.status(200).json({
			status: 'success',
			message: 'Operation réussie',
			data: {
				privateKey:activationKey.privateKey,
				publicKey:activationKey.publicKey,
				iv:activationKey.iv,
			}
			
		});
	}
);
