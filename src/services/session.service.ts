import { AppError } from '../errors/AppError';
import { Session, SessionStatus } from '../models/session.model';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';

export const createSession = async (data: { teacherId: string; startTime: Date; endTime: Date }) => {
  if (data.endTime <= data.startTime) {
    throw AppError.badRequest('endTime must be greater than startTime');
  }
  if (!(await Teacher.exists({ _id: data.teacherId }))) throw AppError.notFound('Teacher not found');

  const overlapping = await Session.exists({
    teacherId: data.teacherId,
    startTime: { $lt: data.endTime },
    endTime: { $gt: data.startTime },
  });
  if (overlapping) throw AppError.conflict('Teacher already has a session in this time range');

  return Session.create({ ...data, status: SessionStatus.AVAILABLE });
};

/** Accepts epoch milliseconds, or epoch seconds (values below 1e11 are read as seconds). */
const toUtcDayRange = (timestamp: number) => {
  const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) throw AppError.badRequest('Invalid dateTimestamp');
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

export const getAvailableSessions = async (dateTimestamp: number) => {
  const { start, end } = toUtcDayRange(dateTimestamp);

  return Session.aggregate([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: start, $lt: end },
      },
    },
    { $sort: { startTime: 1 } },
    {
      $lookup: { from: 'teachers', localField: 'teacherId', foreignField: '_id', as: 'teacher' },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        status: 1,
        startTime: 1,
        endTime: 1,
        teacher: { _id: 1, fullName: 1, specialization: 1, experience: 1 },
      },
    },
  ]);
};

export const bookSession = async (sessionId: string, userId: string) => {
  if (!(await User.exists({ _id: userId }))) throw AppError.notFound('User not found');

  // Single atomic update: of two simultaneous requests, only one can match AVAILABLE.
  const booked = await Session.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { status: SessionStatus.BOOKED, userId },
    { new: true },
  );
  if (booked) return booked;

  if (!(await Session.exists({ _id: sessionId }))) throw AppError.notFound('Session not found');
  throw AppError.conflict('Session is not available for booking');
};

export const completeSession = async (sessionId: string) => {
  const completed = await Session.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { status: SessionStatus.COMPLETED, completedAt: new Date() },
    { new: true },
  );
  if (completed) return completed;

  if (!(await Session.exists({ _id: sessionId }))) throw AppError.notFound('Session not found');
  throw AppError.conflict('Only BOOKED sessions can be marked as completed');
};
