import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AuthContextType } from '../types/auth';

jest.mock('../lib/supabase', () => ({
  getOAuthRedirectUrl: jest.fn(
    (redirectTo = '/app', flow = 'signin') =>
      `http://localhost/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}&flow=${flow}`
  ),
  isOAuthLinked: jest.fn(),
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      signInWithOAuth: jest.fn(),
      linkIdentity: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { AuthProvider, useAuth } from './AuthContext';
import { getOAuthRedirectUrl, isOAuthLinked, supabase } from '../lib/supabase';

const auth = supabase.auth as unknown as Record<string, jest.Mock>;
const getRedirectUrl = getOAuthRedirectUrl as jest.Mock;
const oauthLinked = isOAuthLinked as jest.Mock;
const from = supabase.from as jest.Mock;

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let currentAuth: AuthContextType | undefined;
let container: HTMLDivElement;
let root: Root;

const AuthHarness = () => {
  currentAuth = useAuth();
  return <div>{currentAuth.status}</div>;
};

const renderAuth = async (session: any = null) => {
  auth.getSession.mockResolvedValue({ data: { session }, error: null });
  auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });

  await act(async () => {
    root.render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>
    );
    await Promise.resolve();
  });

  expect(container.textContent).toContain(
    session ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
  );
};

describe('AuthProvider workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRedirectUrl.mockImplementation(
      (redirectTo = '/app', flow = 'signin') =>
        `http://localhost/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}&flow=${flow}`
    );
    currentAuth = undefined;
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('signs out only the current browser session and clears user-scoped storage', async () => {
    auth.signOut.mockResolvedValue({ error: null });
    sessionStorage.setItem('api_cache_user-1', 'sensitive');

    await renderAuth();

    await act(async () => {
      await currentAuth?.signOut();
    });

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(sessionStorage.getItem('api_cache_user-1')).toBeNull();
    expect(container.textContent).toContain('UNAUTHENTICATED');
  });

  it('starts Google sign-in with a safe PKCE callback', async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: null });
    await renderAuth();

    await act(async () => {
      await currentAuth?.signInWithGoogle('/planning?month=8');
    });

    expect(getRedirectUrl).toHaveBeenCalledWith('/planning?month=8');
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/auth/callback'),
        queryParams: { prompt: 'select_account' },
      },
    });
  });

  it('defers profile creation until email verification provides a session', async () => {
    auth.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-1' },
        session: null,
      },
      error: null,
    });
    await renderAuth();

    await act(async () => {
      await currentAuth?.signUp('person@example.com', 'StrongPass1', {
        full_name: 'Test Person',
        user_type: 'individual',
      });
    });

    expect(from).not.toHaveBeenCalled();
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('flow=verify'),
        }),
      })
    );
  });

  it('uses Supabase identity linking for an authenticated account', async () => {
    const session = {
      access_token: 'test-token',
      user: { id: 'user-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated' },
    };
    oauthLinked.mockResolvedValue(false);
    auth.linkIdentity.mockResolvedValue({ data: {}, error: null });
    await renderAuth(session);

    await act(async () => {
      await currentAuth?.linkGoogleAccount();
    });

    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    expect(getRedirectUrl).toHaveBeenCalledWith('/profile', 'link');
    expect(auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('flow=link'),
        queryParams: { prompt: 'select_account' },
      },
    });
  });
});
