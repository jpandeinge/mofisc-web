import React, { act, StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}));

import AuthCallback from './AuthCallbackPage';
import { supabase } from '../lib/supabase';

const auth = supabase.auth as unknown as {
  getSession: jest.Mock;
  verifyOtp: jest.Mock;
};

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

describe('AuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('completes Google sign-in when effects are replayed by Strict Mode', async () => {
    auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'google-user' },
        },
      },
      error: null,
    });

    await act(async () => {
      root.render(
        <StrictMode>
          <MemoryRouter
            initialEntries={['/auth/callback?redirectTo=%2Fapp']}
          >
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/app" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </StrictMode>
      );
      await Promise.resolve();
    });

    expect(container.querySelector('h1')?.textContent).toBe('You are signed in');
    expect(auth.getSession).toHaveBeenCalledTimes(1);
  });
});
