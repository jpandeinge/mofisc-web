import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export const useLogout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const logout = useCallback(async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      toast.success('Signed out securely.');
    } catch {
      // AuthContext clears browser state even when the remote revocation call
      // fails, so the local device is still signed out.
      toast.warning('Signed out on this device. Please close the browser if it is shared.');
    } finally {
      navigate('/signin', { replace: true });
      setIsSigningOut(false);
    }
  }, [isSigningOut, navigate, signOut]);

  return { isSigningOut, logout };
};
