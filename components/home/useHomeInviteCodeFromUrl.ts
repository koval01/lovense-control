import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { AppDispatch } from '@/store';
import { PAIR_CODE_LENGTH } from '@/hooks/use-bridge-session';
import { setMode } from '@/store/slices/connectionSlice';
import { hashToMode } from './hash-mode';

export function useHomeInviteCodeFromUrl(dispatch: AppDispatch, setPairCodeInput: (code: string) => void) {
  const searchParams = useSearchParams();
  const appliedCodeFromUrlRef = useRef(false);
  useEffect(() => {
    if (appliedCodeFromUrlRef.current || typeof window === 'undefined' || !searchParams) return;
    const codeParam = searchParams.get('code');
    const normalized = codeParam?.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, PAIR_CODE_LENGTH) ?? '';
    if (normalized.length !== PAIR_CODE_LENGTH) return;
    appliedCodeFromUrlRef.current = true;
    const modeFromHash = hashToMode();
    if (modeFromHash !== 'partner') {
      dispatch(setMode('partner'));
    }
    setPairCodeInput(normalized);
    const next = new URLSearchParams(searchParams);
    next.delete('code');
    const qs = next.toString();
    const replace = qs ? `${window.location.pathname}?${qs}#partner` : `${window.location.pathname}#partner`;
    window.history.replaceState(null, '', replace);
  }, [searchParams, dispatch, setPairCodeInput]);
}
