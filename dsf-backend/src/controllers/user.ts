import asyncWrapper from '../middlewares/async';
import { Request, Response, NextFunction } from 'express';
import { IUser, CreateUser, GetUserByEmail } from '../models/User';
import { createCustomError } from '../errors/custom-error';
import generateToken from '../utils/helpers';

export const registerUser = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { email, name, password } = req.body as IUser;


		const existingUser = await GetUserByEmail({ email });
		
		if (existingUser) {
			return next(
				createCustomError('Cet adresse email déjà lié à un compte', 400)
			);
		}
		const user = await CreateUser({
			email,
			name,
			password,
		});
		return res.status(201).json({
			status: 'success',
			message: 'Compte créé avec success',
			data: {
				_id: user._id,
				name: user.name,
				email: user.email,
			},
		});
	}
);

export const loginUser = asyncWrapper(
	async (req: Request, res: Response, next: NextFunction) => {
		const { email, password } = req.body as IUser;

		const user = await GetUserByEmail({ email });
		if (!user) {
			return next(
				createCustomError(
					'Compte introuvable, veuillez entrer la bonne adresse email',
					404
				)
			);
		}

		
		if(!(await user?.matchPassword(password))){
			return next(createCustomError('Mot de passe incorrect', 400));

		}

		if (user?.active === false) {

			return res.status(403).json({
				status: 'error',
				message: "Votre compte n'est pas activé",
				data: {
					_id: user._id,
					name: user.name,
					email: user.email,
				},
			});
		} 

		//user found with the correct password
			generateToken(res, user._id as string);

			res.status(200).json({
				status: 'success',
				message: 'Connexion reussie',
				data: {
					_id: user._id,
					name: user.name,
					email: user.email,
				},
			});
	}
);


export const logoutUser = (req:Request, res:Response) => {
	res.clearCookie('jwt')

  res.status(200).json({ status:'success',message: 'Deconnexion reussie' });
};