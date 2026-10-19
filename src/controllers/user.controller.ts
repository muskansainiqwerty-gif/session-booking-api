import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const createUser = async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
};

export const getUserSessions = async (req: Request<{ id: string }>, res: Response) => {
  const data = await userService.getUserSessions(req.params.id);
  res.status(200).json({ success: true, data });
};
