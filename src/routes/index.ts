import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import * as teacherController from '../controllers/teacher.controller';
import * as userController from '../controllers/user.controller';
import { validate } from '../middlewares/validate';
import {
  availableQuerySchema,
  bookSessionSchema,
  createSessionSchema,
  createTeacherSchema,
  createUserSchema,
  idParamSchema,
} from '../validators/schemas';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

// Users
router.post('/users', validate(createUserSchema), userController.createUser);
router.get('/users/:id/sessions', validate(idParamSchema, 'params'), userController.getUserSessions);

// Teachers (helper endpoint so sessions can be created without touching the DB directly)
router.post('/teachers', validate(createTeacherSchema), teacherController.createTeacher);

// Sessions. `/available` is declared before `/:id/...` routes.
router.post('/sessions', validate(createSessionSchema), sessionController.createSession);
router.get(
  '/sessions/available',
  validate(availableQuerySchema, 'query'),
  sessionController.getAvailableSessions,
);
router.post(
  '/sessions/:id/book',
  validate(idParamSchema, 'params'),
  validate(bookSessionSchema),
  sessionController.bookSession,
);
router.patch(
  '/sessions/:id/complete',
  validate(idParamSchema, 'params'),
  sessionController.completeSession,
);

export default router;
