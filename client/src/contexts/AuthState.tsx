import type { IChild, IAuthUser } from "@mathmagic/types";

export interface AuthState {
  user: IAuthUser | null;
  activeChild: IChild | null;
  isLoading: boolean;
}

export interface AuthResponse {
  user: IAuthUser;
  csrfToken: string;
}

export interface RegisterState {
  username: string;
  email: string;
  password: string;
}
