import { Request, Response } from 'express';

// GET /api/adventures/children/:childId/available
export async function getAvailableAdventures(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}

// POST /api/adventures/children/:childId
export async function startAdventure(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}

// GET /api/adventures/:adventureId
export async function getAdventure(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}

// POST /api/adventures/:adventureId/continue
export async function continueAdventure(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}

// POST /api/adventures/:adventureId/answer
export async function answerChallenge(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}

// POST /api/adventures/:adventureId/hint
export async function requestHint(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}

// POST /api/adventures/:adventureId/complete
export async function completeAdventure(_req: Request, res: Response): Promise<void> {
  res.status(501).json({ error: { message: 'Not implemented' } });
}
