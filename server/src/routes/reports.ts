import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { emailRateLimit } from '../middleware/rateLimit';
import * as reportsController from '../controllers/reportsController';

const router = Router();

router.get('/weekly/preview', requireAuth, reportsController.previewWeeklyReportHtml);
router.post('/weekly/send', requireAuth, emailRateLimit, reportsController.sendWeeklyReportNow);

export default router;
