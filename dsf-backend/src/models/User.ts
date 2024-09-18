import { Model, Schema, Types, model } from 'mongoose';
import { emailValidator } from '../utils/helpers';
import bcrypt from 'bcryptjs';

interface IUserMethods {
	matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface IUser {
	_id?: Types.ObjectId | String;
	email: string;
	name: string;
	password: string;
	active?: boolean;
}
type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
	{
		email: {
			type: String,
			required: [true, 'Adresse email est obligatoire'],
			unique: true,
			validate: {
				validator: emailValidator,
			},
		},
		active: { type: Boolean, default: false },
		name: { type: String, required: [true, 'Le nom est obligatoire'] },
		password: {
			type: String,
			required: [true, 'Le mot de passe est obligatoire'],
		},
	},
	{ timestamps: true }
);

userSchema.method(
	'matchPassword',
	async function matchPassword(enteredPassword: string) {
		return await bcrypt.compare(enteredPassword, this.password);
	}
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


export const User = model<IUser, UserModel>('User', userSchema);

export const CreateUser = (data: Partial<IUser>) => User.create(data);

export const GetUserById = (userData: Partial<IUser>) => User.findById(userData._id)

export const GetUserByEmail = (userData: Partial<IUser>) => User.findOne({email:userData.email})

export const UpdateUser = (userId: string, userData: Partial<IUser>) =>
	User.findByIdAndUpdate(
		userId,
		{ name: userData.name, email: userData.email },
		{ new: true, runValidators: true }
	);

export const DeleteUser = (userData: Partial<IUser>) =>
	User.findByIdAndDelete(userData._id);
