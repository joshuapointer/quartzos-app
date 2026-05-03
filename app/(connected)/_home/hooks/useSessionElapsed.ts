import { useEffect, useState } from 'react';

export function useSessionElapsed(sessionActive: boolean, startedAt: number | null | undefined): number {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!sessionActive || !startedAt) { setElapsedSec(0); return; }
    const interval = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [sessionActive, startedAt]);

  return elapsedSec;
}
