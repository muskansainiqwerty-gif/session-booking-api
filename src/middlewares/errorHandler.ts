import { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
    return;
  }
  // Malformed JSON body
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Malformed JSON body' });
    return;
  }
  // Duplicate key from a unique index
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
    return;
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.nodeEnv !== 'production' && { details: err?.message }),
  });
};
