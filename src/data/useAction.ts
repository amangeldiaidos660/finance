import {useRef, useState} from 'react';
import {errorMessage} from './errors';

export function useAction() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (action: () => Promise<void>) => {
    if (locked.current) { return; }
    locked.current = true;
    setBusy(true);
    setError('');
    try { await action(); } catch (reason) { setError(errorMessage(reason)); }
    finally { locked.current = false; setBusy(false); }
  };
  return {busy, error, run, clearError: () => setError('')};
}
