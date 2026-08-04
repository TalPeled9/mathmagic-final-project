import { Request, Response } from 'express';
import User from '../models/User';
import { config } from '../config/index';
import { renderUnsubscribeConfirmationHtml } from '../emails/render';

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  await User.findOneAndUpdate({ unsubscribeToken: token }, { weeklyReportOptIn: false });

  // Always 200, regardless of whether the token matched — don't leak token validity.
  const html = await renderUnsubscribeConfirmationHtml({
    logoUrl: `${config.clientUrl}/images/logo.png`,
  });
  res.type('html').send(html);
}
