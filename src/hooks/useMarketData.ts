import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MarketData {
  trending: any[];
  mostActive: any[];
  priceShockers: any[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData>({
    trending: [],
    mostActive: [],
    priceShockers: [],
    isLoading: true,
    lastUpdated: null
  });
  const { toast } = useToast();

  const fetchMarketData = async () => {
    try {
      setMarketData(prev => ({ ...prev, isLoading: true }));

      // Fetch all market data endpoints
      const [trendingRes, mostActiveRes, priceShockersRes] = await Promise.all([
        supabase.functions.invoke('market-data?endpoint=trending'),
        supabase.functions.invoke('market-data?endpoint=most_active'),
        supabase.functions.invoke('market-data?endpoint=price_shockers')
      ]);

      const trending = trendingRes.data || [];
      const mostActive = mostActiveRes.data || [];
      const priceShockers = priceShockersRes.data || [];

      setMarketData({
        trending,
        mostActive,
        priceShockers,
        isLoading: false,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching market data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch market data",
        variant: "destructive",
      });
      setMarketData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ...marketData,
    refetch: fetchMarketData
  };
};