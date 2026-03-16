 'use client';

import { createContext, useContext } from 'react';

type ToastFn = (message: string) => void;

export const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

