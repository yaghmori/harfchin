"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Shows a Sonner error when `error` becomes a new non-empty string (deduped). */
export function useSyncErrorToToast(error: string | null) {
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== prev.current) {
      toast.error(error);
      prev.current = error;
    }
    if (!error) prev.current = null;
  }, [error]);
}
