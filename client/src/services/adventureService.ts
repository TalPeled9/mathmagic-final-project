import { api } from '../lib/api';
import type {
  GetAvailableResponse,
  StartAdventureRequest,
  StartAdventureResponse,
  GetAdventureResponse,
  GetAdventureImageResponse,
  GetChildAdventuresResponse,
  ContinueAdventureRequest,
  ContinueAdventureResponse,
  AnswerChallengeRequest,
  AnswerChallengeResponse,
  HintResponse,
  CompleteAdventureResponse,
} from '@mathmagic/types';

export const adventureService = {
  getAvailable: (childId: string) =>
    api.get<GetAvailableResponse>(`/adventures/children/${childId}/available`),

  getChildAdventures: (childId: string) =>
    api.get<GetChildAdventuresResponse>(`/adventures/children/${childId}`),

  start: (childId: string, body: StartAdventureRequest) =>
    api.post<StartAdventureResponse>(`/adventures/children/${childId}`, body),

  get: (adventureId: string) =>
    api.get<GetAdventureResponse>(`/adventures/${adventureId}`),

  getImage: (adventureId: string, stepIndex: number) =>
    api.get<GetAdventureImageResponse>(`/adventures/${adventureId}/images/${stepIndex}`),

  continue: (adventureId: string, body: ContinueAdventureRequest) =>
    api.post<ContinueAdventureResponse>(`/adventures/${adventureId}/continue`, body),

  answer: (adventureId: string, body: AnswerChallengeRequest) =>
    api.post<AnswerChallengeResponse>(`/adventures/${adventureId}/answer`, body),

  hint: (adventureId: string) =>
    api.post<HintResponse>(`/adventures/${adventureId}/hint`, {}),

  complete: (adventureId: string) =>
    api.post<CompleteAdventureResponse>(`/adventures/${adventureId}/complete`, {}),
};
