import { Types } from 'mongoose';
import { AppError } from '../errors/AppError';
import { Session, SessionStatus } from '../models/session.model';
import { User } from '../models/user.model';

export const createUser = async (data: { fullName: string; email: string; phone: string }) => {
  const email = data.email.toLowerCase();
  if (await User.exists({ email })) throw AppError.conflict('A user with this email already exists');
  // The unique index still guards against two requests racing past the check above.
  return User.create({ ...data, email });
};

/**
 * Upcoming = BOOKED sessions (not yet marked complete), soonest first.
 * Completed = COMPLETED sessions, most recently completed first.
 */
export const getUserSessions = async (userId: string) => {
  if (!(await User.exists({ _id: userId }))) throw AppError.notFound('User not found');

  const [result] = await Session.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] },
      },
    },
    {
      $lookup: { from: 'teachers', localField: 'teacherId', foreignField: '_id', as: 'teacher' },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        status: 1,
        startTime: 1,
        endTime: 1,
        completedAt: 1,
        teacher: { _id: 1, fullName: 1, specialization: 1, experience: 1 },
      },
    },
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
        ],
      },
    },
  ]);

  return result;
};
