import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

export const objectId = z.string().refine(isValidObjectId, { message: 'Invalid ObjectId' });

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.email().trim(),
  phone: z.string().trim().min(5),
});

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.email().trim(),
  specialization: z.string().trim().min(1),
  experience: z.number().min(0),
});

export const createSessionSchema = z.object({
  teacherId: objectId,
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export const bookSessionSchema = z.object({ userId: objectId });

export const idParamSchema = z.object({ id: objectId });

export const availableQuerySchema = z.object({
  dateTimestamp: z.coerce.number().int().positive(),
});
