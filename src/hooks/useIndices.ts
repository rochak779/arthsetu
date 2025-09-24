import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type IndexInfo = { price: number; changePct: number } | null;

export const useIndices = () => {
  const [nifty, setNifty] = useState<IndexInfo>(null);
  const [sensex, setSensex] = useState<IndexInfo>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndices = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke('indices-snapshot');
      if (error) throw new Error(error.message || 'Failed to fetch indices');
      if (!data || data.error) throw new Error(data?.error || 'Invalid response');
      setNifty(data.indices?.nifty ?? null);
      setSensex(data.indices?.sensex ?? null);
      setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch indices';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const id = setInterval(fetchIndices, 30_000); // 30s refresh
    return () => clearInterval(id);
  }, []);

  return { nifty, sensex, lastUpdated, loading, error, refetch: fetchIndices };
};
