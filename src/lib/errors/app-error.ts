export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function getClientErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
