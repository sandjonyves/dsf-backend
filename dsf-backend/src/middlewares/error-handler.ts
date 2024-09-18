import { NextFunction, Request, Response } from "express"

import { CustomAPIError, CustomValidationError } from '../errors/custom-error'

const errorHandlerMiddleware = (err:any, req:Request, res:Response, next:NextFunction) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({status:'error', message: err.message })
  }
  if (err instanceof CustomValidationError) {
    return res.status(err.statusCode).json({status: 'error', message: 'ValidationError',errors: err.errors
   })
  }


  if (err.name === 'ValidationError') {
    const errorMessages: { [key: string]: string } = {};
    for (const key in err.errors) {
      errorMessages[key.substring(key.lastIndexOf('.')+1)] = err.errors[key].message;
    }
    return res.status(400).json({ status: 'error', message: 'ValidationError', errors: errorMessages });
  }
  console.log(err)

  return res.status(500).json({ message: 'Internal server error, try again later', status:'error'})
}

export default errorHandlerMiddleware
