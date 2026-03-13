import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  const error = new Error(`Route ${request.method} ${request.originalUrl} not found`) as Error & {
    statusCode?: number;
  };

  error.statusCode = 404;
  next(error);
}
