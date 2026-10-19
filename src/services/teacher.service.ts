import { Teacher } from '../models/teacher.model';

export const createTeacher = (data: {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
}) => Teacher.create(data);
