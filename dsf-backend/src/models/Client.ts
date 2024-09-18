import { Model, Schema, Types, model } from 'mongoose';
import { emailValidator, fiscalIdValidator } from '../utils/helpers';
import bcrypt from 'bcryptjs';

// A 0000 0000 0000 A
export interface IClient {
	_id?: Types.ObjectId | string;
	fiscalId?: string;
	email: string;
	clientName: string;
	tel?: string;
	dbUrl: string;
	otp?: string;
	otpExpiryTime: Date;

}

interface IClientMethods {
	correctOTP(
		candidateOTP: string,
		clientOTP: string | undefined
	): Promise<boolean>;
}

type ClientModel = Model<IClient, {}, IClientMethods>;

const clientSchema = new Schema<IClient, ClientModel, IClientMethods>({
	fiscalId: {
		type: String,
		required: [true, "L'identifiant fiscal est obligatoire"],
		validate: {
			validator: fiscalIdValidator,
			message: "L'id fiscal est incorrect",
		},
		get: function (value: string) {
			if (!value) {
				return value.replace(
					/(\w{1})(\w{4})(\w{4})(\w{4})(\w{1})/,
					'$1 $2 $3 $4 $5'
				); /*this
        function format the numIdFiscal to be properly readable*/
			}
			return value;
		},
	},
	clientName: {
		type: String,
		required: [true, 'Le nom du client est obligatoire'],
	},
	email: {
		type: String,
		required: [true, "L'adresse email est obligatoire"],
		unique: true,
		validate: {
			validator: emailValidator,
			message: 'Veuillez entrer une adresse email valide',
		},
	},
	tel: {
		type: String,
		required: [true, 'Le numéro de téléphone est obligatoire'],
	},
	dbUrl: {
		type: String,
		required: [true, 'Le lien de bd distante est obligatoire'],
	},
	otp: {
		type: String,
	},
	otpExpiryTime: {
		type: Date,
	},
});

clientSchema.pre('findOneAndUpdate', async function (next) {
	const update: any = this.getUpdate();
	if (!update || !update.otp) return next();
	update.otp = await bcrypt.hash(update.otp, 12);
	next();
});

clientSchema.method(
	'correctOTP',
	async function correctOTP(candidateOTP: string, userOTP: string) {
		return await bcrypt.compare(candidateOTP, userOTP);
	}
);

export const Client = model<IClient, ClientModel>('Client', clientSchema);

export const CreateClient = (data: Partial<IClient>) => Client.create(data);

export const GetClient = (clientData: Partial<IClient>) => {
	let conditions = [];
	if (clientData._id) conditions.push({ _id: clientData._id });
	if (clientData.fiscalId) conditions.push({ fiscalId: clientData.fiscalId });
	if (clientData.email) conditions.push({ email: clientData.email });

	return Client.findOne({
		$or: conditions,
	});
};

export const GetAllClients = () => Client.find();

export const UpdateClient = (clientId: string, clientData: Partial<IClient>) =>
	Client.findByIdAndUpdate(
		clientId,
		{
			clientName: clientData.clientName,
			fiscalId: clientData.fiscalId,
			tel: clientData.tel,
			email: clientData.email,
			dbUrl: clientData.dbUrl,
		},
		{ new: true, runValidators: true }
	);

export const DeleteClient = (clientData: Partial<IClient>) =>{
	const conditions = []
	if(clientData._id) conditions.push({"_id":clientData._id})
	if(clientData.email) conditions.push({"email":clientData.email})
	if(clientData.fiscalId) conditions.push({"fiscalId":clientData.fiscalId})
	return 	Client.findOneAndDelete({
		$or:conditions,
	});
}


export const DeleteManyClients = (clientIds: string[]) =>
	Client.deleteMany({
		_id: { $in: clientIds },
	});
