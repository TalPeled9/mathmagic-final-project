import { useState, useCallback } from 'react';
import type {
  StorySegment,
  AnswerChallengeResponse,
  HintResponse,
  CompleteAdventureResponse,
} from '@mathmagic/types';
import { adventureService } from '../services/adventureService';

interface UseAdventureReturn {
  adventureId: string | null;
  segments: StorySegment[];
  lastAnswerFeedback: AnswerChallengeResponse | null;
  hints: HintResponse[];
  completionData: CompleteAdventureResponse | null;
  isLoading: boolean;
  error: string | null;
  startAdventure: (childId: string, mathTopic: string, storyWorld: string) => Promise<void>;
  resumeAdventure: (id: string) => Promise<void>;
  sendChoice: (choiceIndex: number) => Promise<void>;
  submitAnswer: (answer: string) => Promise<AnswerChallengeResponse>;
  requestHint: () => Promise<void>;
  completeAdventure: () => Promise<void>;
}

export function useAdventure(): UseAdventureReturn {
  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<AnswerChallengeResponse | null>(null);
  const [hints, setHints] = useState<HintResponse[]>([]);
  const [completionData, setCompletionData] = useState<CompleteAdventureResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAdventure = useCallback(async (childId: string, mathTopic: string, storyWorld: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adventureService.start(childId, { mathTopic, storyWorld });
      setAdventureId(response.adventureId);
      setSegments([response.segment]);
      setLastAnswerFeedback(null);
      setHints([]);
      setCompletionData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start adventure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resumeAdventure = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adventureService.get(id);
      setAdventureId(response.adventureId);
      setSegments([response.currentSegment]);
      setLastAnswerFeedback(null);
      setHints([]);
      setCompletionData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume adventure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendChoice = useCallback(async (choiceIndex: number) => {
    if (!adventureId) return;
    setIsLoading(true);
    setError(null);
    setLastAnswerFeedback(null);
    setHints([]);
    try {
      const response = await adventureService.continue(adventureId, { choiceIndex });
      setSegments((prev) => [...prev, response.segment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue adventure');
    } finally {
      setIsLoading(false);
    }
  }, [adventureId]);

  const submitAnswer = useCallback(async (answer: string): Promise<AnswerChallengeResponse> => {
    if (!adventureId) throw new Error('No active adventure');
    setIsLoading(true);
    setError(null);
    try {
      const response = await adventureService.answer(adventureId, { answer });
      setLastAnswerFeedback(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit answer';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [adventureId]);

  const requestHint = useCallback(async () => {
    if (!adventureId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await adventureService.hint(adventureId);
      setHints((prev) => [...prev, response]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get hint');
    } finally {
      setIsLoading(false);
    }
  }, [adventureId]);

  const completeAdventure = useCallback(async () => {
    if (!adventureId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await adventureService.complete(adventureId);
      setCompletionData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete adventure');
    } finally {
      setIsLoading(false);
    }
  }, [adventureId]);

  return {
    adventureId,
    segments,
    lastAnswerFeedback,
    hints,
    completionData,
    isLoading,
    error,
    startAdventure,
    resumeAdventure,
    sendChoice,
    submitAnswer,
    requestHint,
    completeAdventure,
  };
}
