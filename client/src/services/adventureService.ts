import { api } from '../lib/api';
import type {
  GetAvailableResponse,
  StartAdventureRequest,
  StartAdventureResponse,
  GetAdventureResponse,
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
    api.get<GetAvailableResponse>(`/children/${childId}/adventures/available`),

  getChildAdventures: (childId: string) =>
    api.get<GetChildAdventuresResponse>(`/children/${childId}/adventures`),

  start: (childId: string, body: StartAdventureRequest) =>
    api.post<StartAdventureResponse>(`/children/${childId}/adventures`, body),

  get: (adventureId: string) =>
    api.get<GetAdventureResponse>(`/adventures/${adventureId}`),

  continue: (adventureId: string, body: ContinueAdventureRequest) =>
    api.post<ContinueAdventureResponse>(`/adventures/${adventureId}/continue`, body),

  answer: (adventureId: string, body: AnswerChallengeRequest) =>
    api.post<AnswerChallengeResponse>(`/adventures/${adventureId}/answer`, body),

  hint: (adventureId: string) =>
    api.post<HintResponse>(`/adventures/${adventureId}/hint`, {}),

  complete: (adventureId: string) =>
    api.post<CompleteAdventureResponse>(`/adventures/${adventureId}/complete`, {}),
};
