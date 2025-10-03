import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockQuote {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  pChange: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
}

export const useStockQuote = (symbol: string | null) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('stock-quote', {
        body: { symbol }
      });

      if (functionError) {
        throw functionError;
      }

      if (data) {
        setQuote(data);
      }
    } catch (err) {
      console.error('Error fetching stock quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stock quote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [symbol]);

  return { quote, loading, error, refetch: fetchQuote };
};
