import type { IChild, IUser } from "@mathmagic/types";

export interface AuthState {
  user: IUser | null;
  activeChild: IChild | null;
  isLoading: boolean;
}

export interface AuthResponse {
  user: IUser;
  csrfToken: string;
}

export type RegisterState = Omit<IUser, 'id'> & { password: string; };
