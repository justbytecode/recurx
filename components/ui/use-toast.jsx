'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';

export function useToast() {
  const toastFn = useCallback(({ title, description, variant }) => {
    if (variant === 'destructive') {
      toast.error(`${title}: ${description}`);
    } else {
      toast.success(`${title}: ${description}`);
    }
  }, []);

  return { toast: toastFn };
}