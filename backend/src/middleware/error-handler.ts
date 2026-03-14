import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger.js';

type HttpError = Error & {
  statusCode?: number;
  code?: string;
};

export function errorHandler(
  error: HttpError,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const statusCode = error.statusCode ?? 500;

  logger.error(
    {
      err: error,
      statusCode,
      method: _request.method,
      path: _request.originalUrl,
    },
    'Request failed'
  );

  response.status(statusCode).json({
    ok: false,
    code: error.code,
    message: error.message || 'Internal server error',
  });
}
