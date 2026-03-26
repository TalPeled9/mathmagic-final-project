import { Router } from 'express';
import { validate } from '../middleware/validateRequest';
import { googleAuthSchema, loginSchema, registerSchema } from '../validators/auth.schemas';
import { verifyCsrf } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/google', validate({ body: googleAuthSchema }), authController.googleAuth);
router.post('/refresh', verifyCsrf, authController.refreshToken);
router.post('/logout', verifyCsrf, authController.logout);

export default router;
