import crypto from 'crypto';
import { IKey } from '../models/Key';

// Defining algorithm
const algorithm = 'aes-256-cbc';

// Defining key
const key = crypto
	.createHash('sha256')
	// .update(process.env.POWERKS_SECRET || 'powerksoft-secret', 'utf-8')
  .update('powerksoft-secret', 'utf-8')
	.digest();

const createDate = (numberOfdays: number): Date => {
	const currentDate = new Date();
	const targetDate = new Date(
		currentDate.getTime() + numberOfdays * 24 * 60 * 60 * 1000
	);
	return targetDate;
};
export const parseKeys = (existingKey: Partial<IKey>) => {
	const publicKeyJSON = existingKey.publicKey;
	const privateKeyJSON = existingKey.privateKey;

	const publicKeyJWK = JSON.parse(
		decrypt(<string>existingKey.iv, <string>publicKeyJSON)
	);
	const privateKeyJWK = JSON.parse(
		decrypt(<string>existingKey.iv, <string>privateKeyJSON)
	);
	const { expirationDate } = privateKeyJWK;

	// @ts-ignore
	const publicKey = crypto.createPublicKey({
		key: publicKeyJWK,
		format: 'jwk',
		type: 'rsa',
	});
	// @ts-ignore
	const privateKey = crypto.createPrivateKey({
		key: privateKeyJWK,
		format: 'jwk',
		type: 'rsa',
	});

	return [publicKey, privateKey, expirationDate];
};

export const generateKeys = (
	numberOfdays: number
): {
	publicKeyJSONEncrypted: string;
	privateKeyJSONEncrypted: string;
	ivString: string;
	expirationDate: Date;
} => {
	const iv = crypto.randomBytes(16);
	const ivString = iv.toString('hex');
	const expirationDate = createDate(numberOfdays);

	const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
		modulusLength: 2048,
	});

	const publicKeyJWK = {
		...publicKey.export({ format: 'jwk' }),
	};

	// Créer un objet JWK pour la clé privée avec la date d'expiration
	const privateKeyJWK = {
		...privateKey.export({ format: 'jwk' }),
		expirationDate: expirationDate.toISOString(), // Ajouter la date d'expiration
	};

	// Convertir les clés JWK en JSON
	const publicKeyJSON = JSON.stringify(publicKeyJWK);
	const privateKeyJSON = JSON.stringify(privateKeyJWK);

	// encrypt JSON keys
	const publicKeyJSONEncrypted = encrypt(publicKeyJSON, iv);
	const privateKeyJSONEncrypted = encrypt(privateKeyJSON, iv);

	return {
		publicKeyJSONEncrypted,
		privateKeyJSONEncrypted,
		ivString,
		expirationDate,
	};
};

export const hasExpiredOrNotValid = (
	publicKey: crypto.KeyObject,
	privateKey: crypto.KeyObject,
	expirationDate: Date,
	emailInput = 'powerks@email.com',
	emailFromdb = 'powerks@email.com'
) => {
	const signature = crypto.sign('sha256', Buffer.from(emailFromdb), {
		key: privateKey,
	});
	const isValid = crypto.verify(
		'sha256',
		Buffer.from(emailInput),
		{
			key: publicKey,
		},
		signature
	);

	if (!isValid)
		return {
			isValid: isValid,
			status: true,
			message: "Clé d'activation invalide",
		};

	// Comparer la date d'expiration extraite avec la date actuelle
	const currentDate = new Date();

	const isExpired = currentDate > new Date(expirationDate);
	return {
		status: isExpired,
		isValid: isValid,
		message: isExpired ? "Votre clé d'activation a expirée" : 'Activation ok',
	};
};

// An encrypt function
export const encrypt = (data: string, iv: Buffer) => {
	// Creating Cipheriv with its parameter
	let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

	// Updating text
	let encrypted = cipher.update(data);

	// Using concatenation
	encrypted = Buffer.concat([encrypted, cipher.final()]);

	// Returning ncrypted data
	return encrypted.toString('hex');
};

// A decrypt function
export const decrypt = (ivInput: string, encryptedData: string) => {
	let iv = Buffer.from(ivInput, 'hex');
	let encryptedText = Buffer.from(encryptedData, 'hex');

	// Creating Decipher
	let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

	// Updating encrypted text
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);

	// returns data after decryption
	return decrypted.toString();
};
