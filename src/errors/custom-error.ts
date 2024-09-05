class CustomAPIError extends Error {
  statusCode: number;
  status:string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = 'error';
  }
}
class CustomValidationError extends Error{
  errors: Record<string, any>
  statusCode: number;
  status:string;

  constructor(message: string, statusCode: number, errors: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.status = 'error';
    this.errors = errors;
  }
}


const createCustomError = (msg: string, statusCode: number): CustomAPIError => {
  return new CustomAPIError(msg, statusCode);
};

const createValidationError = (msg: string, statusCode: number,errors: Record<string, any>): CustomValidationError => {
  return new CustomValidationError(msg, statusCode, errors);
};

export { createCustomError, createValidationError,CustomAPIError, CustomValidationError };
