import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

const mockConfig = vi.hoisted(() => ({
  resend: { apiKey: 'test-key', fromEmail: 'MathMagic Reports <test@example.com>' },
}));
vi.mock('../../config/index', () => ({ config: mockConfig }));

import { getOrCreateUnsubscribeToken, sendEmail } from '../../services/emailService';

describe('sendEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockConfig.resend.apiKey = 'test-key';
  });

  it('calls the Resend client with the expected payload shape and returns ok:true', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email_123' }, error: null });

    const result = await sendEmail({
      to: 'parent@example.com',
      subject: 'Weekly Report',
      html: '<p>hi</p>',
      text: 'hi',
      headers: { 'List-Unsubscribe': '<https://example.com>' },
    });

    expect(result).toEqual({ ok: true, id: 'email_123' });
    expect(mockSend).toHaveBeenCalledWith({
      from: 'MathMagic Reports <test@example.com>',
      to: 'parent@example.com',
      subject: 'Weekly Report',
      html: '<p>hi</p>',
      text: 'hi',
      headers: { 'List-Unsubscribe': '<https://example.com>' },
    });
  });

  it('returns ok:false without throwing when Resend responds with an error', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'invalid recipient', statusCode: 400, name: 'validation_error' },
    });

    const result = await sendEmail({ to: 'bad', subject: 's', html: 'h', text: 't' });

    expect(result).toEqual({ ok: false, error: 'invalid recipient' });
  });

  it('returns ok:false without throwing when the SDK call itself rejects', async () => {
    mockSend.mockRejectedValue(new Error('network down'));

    const result = await sendEmail({ to: 'p@example.com', subject: 's', html: 'h', text: 't' });

    expect(result).toEqual({ ok: false, error: 'network down' });
  });

  it('skips sending and returns ok:false when no API key is configured', async () => {
    mockConfig.resend.apiKey = '';

    const result = await sendEmail({ to: 'p@example.com', subject: 's', html: 'h', text: 't' });

    expect(result.ok).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('getOrCreateUnsubscribeToken', () => {
  it('returns the existing token without saving when one is already set', async () => {
    const save = vi.fn();
    const user = { unsubscribeToken: 'existing-token', save } as unknown as Parameters<
      typeof getOrCreateUnsubscribeToken
    >[0];

    const token = await getOrCreateUnsubscribeToken(user);

    expect(token).toBe('existing-token');
    expect(save).not.toHaveBeenCalled();
  });

  it('generates and persists a new token when none is set', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const user = { unsubscribeToken: undefined, save } as unknown as Parameters<
      typeof getOrCreateUnsubscribeToken
    >[0];

    const token = await getOrCreateUnsubscribeToken(user);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
