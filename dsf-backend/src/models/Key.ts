import { Document, Schema, Types, model } from 'mongoose';

export interface IKey {
	_id?: Types.ObjectId | string;
	clientId: Types.ObjectId | string;
	publicKey: string;
	privateKey: string;
	iv: string;
	expirationDate: Date;
	numberOfdays: number;
}

interface KeyDocument extends Document, Omit<IKey,'_id'> {
  hasExpired: string; 
}
const keySchema = new Schema<IKey>({
	//@ts-expect-error
	clientId: {
		type: Types.ObjectId,
		ref: 'Client',
	},
	publicKey: {
		type: String,
		required: true,
	},
	privateKey: {
		type: String,
		required: true,
	},
	iv: {
		type: String,
		required: true,
	},
	expirationDate: Date,
	numberOfdays: Number,
});

	keySchema.virtual('hasExpired').get(function (this: KeyDocument) {
		const currentDate = new Date();

		return currentDate > new Date(this.expirationDate)
	});
keySchema.set('toObject', { virtuals: true });

export const Key = model<KeyDocument>('Key', keySchema);

export const CreateKey = (data: Partial<IKey>) => Key.create(data);

export const GetKey = (keyData: Partial<IKey>, allFields=false) =>{
	let conditions = [];
	if(keyData._id) conditions.push({'_id':keyData._id})
	if(keyData.clientId) conditions.push({'clientId':keyData.clientId})

	if(allFields){
		return Key.findOne({
			$or: conditions,
		})
	}
	return Key.findOne({
		$or: conditions,
	})
		.select('-privateKey -publicKey -iv')
		.populate('clientId','clientName fiscalId')
}


export const GetAllKeys = () =>
	Key.find().select('-privateKey -publicKey -iv').populate('clientId','clientName fiscalId');

export const UpdateKey = (keyId: string, keyData: Partial<IKey>) =>
	Key.findByIdAndUpdate(
		keyId,
		{
			privateKey: keyData.privateKey,
			publicKey: keyData.publicKey,
			iv: keyData.iv,
			numberOfdays: keyData.numberOfdays,
			expirationDate: keyData.expirationDate,
		},
		{ new: true, runValidators: true }
	);

export const DeleteKey = (keyData: Partial<IKey>) =>{
	let conditions = [];
	if(keyData._id) conditions.push({'_id':keyData._id})
	if(keyData.clientId) conditions.push({'clientId':keyData.clientId})
	return Key.findOneAndDelete({
		
		$or: conditions,
	});
}

export const DeleteManyKeys = (keyIds: string[]) =>
	Key.deleteMany({
		_id: { $in: keyIds },
	});
