import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketData {
  trending: StockData[];
  gainers: StockData[];
  losers: StockData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'nse_market_data';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData>({
    trending: [],
    gainers: [],
    losers: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  });
  const { toast } = useToast();

  const getCachedData = (): MarketData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = new Date(data.lastUpdated).getTime();
        const now = new Date().getTime();
        
        if (now - cacheTime < CACHE_DURATION) {
          return {
            ...data,
            lastUpdated: new Date(data.lastUpdated),
            isLoading: false,
            error: null
          };
        }
      }
    } catch (error) {
      console.error('Error reading cached data:', error);
    }
    return null;
  };

  const setCachedData = (data: MarketData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        trending: data.trending,
        gainers: data.gainers,
        losers: data.losers,
        lastUpdated: data.lastUpdated?.toISOString()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  const fetchMarketData = async (showToast = true) => {
    try {
      setMarketData(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('Fetching market data from NSE...');
      const response = await supabase.functions.invoke('nse-market-data', {
        body: { endpoint: 'all' }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch market data');
      }

      const data = response.data;
      
      if (!data || data.error) {
        throw new Error(data?.error || 'Invalid response from server');
      }

      const newMarketData: MarketData = {
        trending: data.trending || [],
        gainers: data.gainers || [],
        losers: data.losers || [],
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      };

      setMarketData(newMarketData);
      setCachedData(newMarketData);

      if (showToast) {
        toast({
          title: "Success",
          description: "Market data updated successfully",
        });
      }

    } catch (error) {
      console.error('Error fetching market data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market data';
      
      setMarketData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));

      if (showToast) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    // Try to load cached data first
    const cached = getCachedData();
    if (cached) {
      setMarketData(cached);
      console.log('Loaded cached market data');
    } else {
      // Fetch fresh data only if no cache
      fetchMarketData(false);
    }
  }, []);

  return {
    ...marketData,
    refetch: () => fetchMarketData(true),
    hasData: marketData.trending.length > 0 || marketData.gainers.length > 0 || marketData.losers.length > 0
  };
};