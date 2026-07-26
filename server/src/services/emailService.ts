import crypto from 'crypto';
import { HydratedDocument } from 'mongoose';
import { Resend } from 'resend';
import { config } from '../config/index';
import { logger } from '../lib/logger';
import { IUser } from '../models/User';

let _resendClient: Resend | null = null;

function getClient(): Resend {
  if (!_resendClient) _resendClient = new Resend(config.resend.apiKey);
  return _resendClient;
}

/** Generates the parent's one-click unsubscribe token on first use and persists it. */
export async function getOrCreateUnsubscribeToken(user: HydratedDocument<IUser>): Promise<string> {
  if (user.unsubscribeToken) return user.unsubscribeToken;
  user.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  await user.save();
  return user.unsubscribeToken;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Sends an email via Resend. Never throws — isolates one bad send from the rest
 * of a batch (e.g. the weekly cron iterating many parents).
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!config.resend.apiKey) {
    logger.warn({ to: params.to }, 'RESEND_API_KEY not configured — skipping email send');
    return { ok: false, error: 'Resend not configured' };
  }

  try {
    const { data, error } = await getClient().emails.send({
      from: config.resend.fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      headers: params.headers,
    });

    if (error || !data) {
      logger.error({ err: error, to: params.to }, 'Resend email send failed');
      return { ok: false, error: error?.message ?? 'Unknown Resend error' };
    }

    return { ok: true, id: data.id };
  } catch (err) {
    logger.error({ err, to: params.to }, 'Resend email send threw');
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
