import { Router } from 'express';
import * as emailPreferencesController from '../controllers/emailPreferencesController';

const router = Router();

// No requireAuth — this is reached from a link inside an email, not an authenticated session.
router.get('/unsubscribe/:token', emailPreferencesController.unsubscribe);
router.post('/unsubscribe/:token', emailPreferencesController.unsubscribe);

export default router;
