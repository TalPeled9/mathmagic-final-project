import { createContext,  } from 'react';
import type { IChild } from '@mathmagic/types';
import type { AuthState, RegisterState } from './AuthState';


export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  googleAuth: (credential: string) => Promise<void>;
  register: (registerState: RegisterState) => Promise<void>;
  logout: () => Promise<void>;
  setActiveChild: (child: IChild | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

