import { Router } from 'express';
import { validate } from '../middleware/validateRequest';
import { googleAuthSchema } from '../validators/auth.schemas';
import { verifyCsrf } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/google', validate({ body: googleAuthSchema }), authController.googleAuth);
router.post('/refresh', verifyCsrf, authController.refreshToken);
router.post('/logout', verifyCsrf, authController.logout);

export default router;
