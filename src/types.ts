import { Request } from "express";
import { IUser } from "./models/User";
import { IClient } from "./models/Client";

export interface CustomRequest extends Request{
  user:IUser
}

export interface CustomRequestClient extends Request{
  user:IClient
}
