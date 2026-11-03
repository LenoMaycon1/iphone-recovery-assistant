import { useCallback, useEffect, useState } from 'react';
import { fetchServiceRecords, type ServiceRecord } from '@/lib/serviceRecords';

export function useServiceRecords() {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecords(await fetchServiceRecords());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { records, isLoading, error, reload };
}
