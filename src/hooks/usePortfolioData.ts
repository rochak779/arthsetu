import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortfolioHolding {
  id: number;
  tradingsymbol: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  exchange: string;
  product: string;
  updated_at: string;
}

interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: PortfolioHolding[];
  lastUpdated: Date | null;
}

export const usePortfolioData = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: 0,
    totalInvested: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    holdings: [],
    lastUpdated: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPortfolioData = async () => {
    try {
      const { data: holdings, error } = await supabase
        .from('kite_holdings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (holdings && holdings.length > 0) {
        const totalValue = holdings.reduce((sum, holding) => 
          sum + (holding.last_price * holding.quantity), 0
        );
        const totalInvested = holdings.reduce((sum, holding) => 
          sum + (holding.average_price * holding.quantity), 0
        );
        const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0);
        const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        setPortfolioData({
          totalValue,
          totalInvested,
          totalPnL,
          totalPnLPercent,
          holdings,
          lastUpdated: holdings[0]?.updated_at ? new Date(holdings[0].updated_at) : null
        });
      } else {
        setPortfolioData({
          totalValue: 0,
          totalInvested: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          holdings: [],
          lastUpdated: null
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshPortfolio = async () => {
    setIsRefreshing(true);
    
    try {
      // Call the kite-holdings edge function to fetch fresh data
      const { error } = await supabase.functions.invoke('kite-holdings');
      
      if (error) throw error;
      
      // Fetch the updated data
      await fetchPortfolioData();
      
      toast({
        title: "Success",
        description: "Portfolio data refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to refresh portfolio data",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  return {
    portfolioData,
    isLoading,
    isRefreshing,
    refreshPortfolio
  };
};