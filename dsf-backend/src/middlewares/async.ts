import { NextFunction, Request, Response } from "express"


const asyncWrapper = (fn:(req:Request, res:Response, next:NextFunction)=>void) => {
   /* the goal of the func is to avoid define async function on for controllers
  */
  return async (req:Request, res:Response, next:NextFunction) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

export default asyncWrapper
