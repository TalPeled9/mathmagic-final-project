import {   useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {  IChild } from '@mathmagic/types';
import { api } from '../lib/api';
import type { AuthState, AuthResponse, RegisterState } from './AuthState';
import { AuthContext } from './AuthContext';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    activeChild: null,
    isLoading: true,
  });

  // Restore session on mount via parent profile endpoint
  useEffect(() => {
    api
      .get<{ id: string; email: string; name: string }>('/parent/profile')
      .then((data) =>
        setState((s) => ({
          ...s,
          user: { id: data.id, email: data.email, name: data.name },
          isLoading: false,
        }))
      )
      .catch(() => setState((s) => ({ ...s, isLoading: false })));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api.post<AuthResponse>('/auth/login', { email, password });
    setState((s) => ({ ...s, user }));
  }, []);

  const register = useCallback(async (registerState: RegisterState) => {
    const { user } = await api.post<AuthResponse>('/auth/register', registerState);
    setState((s) => ({ ...s, user }));
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setState({ user: null, activeChild: null, isLoading: false });
  }, []);

  const setActiveChild = useCallback((child: IChild | null) => {
    setState((s) => ({ ...s, activeChild: child }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setActiveChild }}>
      {children}
    </AuthContext.Provider>
  );
}
