import { RequestHandler } from 'express';
import { ZodType } from 'zod';
import { AppError } from '../errors/AppError';

type Target = 'body' | 'params' | 'query';

// Validates one part of the request and replaces it with the parsed value.
export const validate =
  (schema: ZodType, target: Target = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      throw AppError.badRequest('Validation failed', details);
    }
    // req.query is a getter in Express 5, so store the parsed value separately.
    Object.defineProperty(req, target, { value: result.data, writable: true });
    next();
  };
