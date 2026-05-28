import { api } from '../lib/api';
import type {
  IChild,
  CreateChildRequest,
  UpdateChildRequest,
  GenerateAvatarRequest,
  SetActiveAvatarRequest,
} from '@mathmagic/types';

export const childService = {
  getAll: () => api.get<{ children: IChild[] }>('/parent/children').then((r) => r.children),
  getOne: (id: string) =>
    api.get<{ child: IChild }>(`/parent/children/${id}`).then((r) => r.child),
  create: (data: CreateChildRequest) =>
    api.post<{ child: IChild }>('/parent/children', data).then((r) => r.child),
  update: (id: string, data: UpdateChildRequest) =>
    api.put<{ child: IChild }>(`/parent/children/${id}`, data).then((r) => r.child),
  generateAvatar: (id: string, data: GenerateAvatarRequest) =>
    api
      .post<{ child: IChild }>(`/parent/children/${id}/avatar`, data)
      .then((r) => r.child),
  setActiveAvatar: (id: string, data: SetActiveAvatarRequest) =>
    api
      .patch<{ child: IChild }>(`/parent/children/${id}/avatar/active`, data)
      .then((r) => r.child),
};
