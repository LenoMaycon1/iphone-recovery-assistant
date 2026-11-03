import { useCallback, useState } from 'react';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences, type Preferences } from '@/lib/preferences';

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() =>
    typeof window === 'undefined' ? DEFAULT_PREFERENCES : loadPreferences(),
  );

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      savePreferences(next);
      return next;
    });
  }, []);

  return { preferences, updatePreferences };
}
