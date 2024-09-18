import jwt, { Secret } from 'jsonwebtoken';
import { createCustomError } from '../errors/custom-error';
import asyncWrapper from './async';
import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { CustomRequest, CustomRequestClient } from '../types';
import { Client } from '../models/Client';

export const protect = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		let token;

		token = req.cookies.jwt;

		if (token) {
			try {
				const decoded = jwt.verify(
					token,
					process.env.JWT_SECRET as Secret
				) as jwt.JwtPayload;

				(req as CustomRequest).user = await User.findById(
					decoded.userId
				).select('-password');

				next();
			} catch (error) {
				return next(
					createCustomError('Non Autorisé, token invalide token ', 401)
				);
			}
		} else {
			next(createCustomError("Non Autorisé, pas de token d'accès", 401));
		}
	}
);

export const protectClient = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		let credentials;

		credentials = req.headers.authorization;
		// token = req.body?.client?.token;

		if (credentials) {
			let token = credentials.split(' ')[1] || '';
			try {
				const decoded = jwt.verify(
					token,
					process.env.JWT_SECRET as Secret
				) as jwt.JwtPayload;

				(req as CustomRequestClient).user = await Client.findById(
					decoded.userId
				).select('-password');

				next();
			} catch (error) {
				return next(
					createCustomError('Non Autorisé, token invalide token ', 401)
				);
			}
		} else {
			next(createCustomError("Non Autorisé, pas de token d'accès", 401));
		}
	}
);
