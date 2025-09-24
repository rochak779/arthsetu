import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { format } from "date-fns";
import logo from "@/assets/logo.svg";

// Default/fallback data structure
const formatStockData = (apiData: any[]): any[] => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.slice(0, 10).map((item: any, index: number) => ({
    symbol: item.symbol || item.stock_name || `STOCK${index + 1}`,
    name: item.name || item.company_name || item.symbol || `Stock ${index + 1}`,
    price: item.price || item.current_price || item.ltp || 100 + Math.random() * 500,
    change: item.change || item.change_percent || (Math.random() - 0.5) * 10,
    changePercent: item.change_percent || item.percentage_change || (Math.random() - 0.5) * 10
  }));
};

const StockCard = ({
  stock,
  price,
  change
}: {
  stock: string;
  price: number;
  change: number;
}) => (
  <Card className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">{stock}</h3>
          <p className="text-sm text-muted-foreground">₹{price.toFixed(2)}</p>
        </div>
        <div className={`flex items-center gap-1 ${change > 0 ? 'text-primary' : 'text-destructive'}`}>
          {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span className="font-semibold text-sm">
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const MarketSection = ({
  title,
  stocks
}: {
  title: string;
  stocks: Array<{
    symbol: string;
    price: number;
    changePercent: number;
  }>;
}) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <div className="space-y-2">
      {stocks.map(item => (
        <StockCard 
          key={item.symbol} 
          stock={item.symbol}
          price={item.price}
          change={item.changePercent}
        />
      ))}
    </div>
  </div>
);

const Market = () => {
  const { trending, gainers, losers, isLoading, error, lastUpdated, refetch, hasData } = useMarketData();

  const trendingStocks = trending || [];
  const gainerStocks = gainers || [];
  const loserStocks = losers || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ArthSetu Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">ArthSetu</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Market</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Market Overview */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Market Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">NIFTY 50</p>
                <p className="text-xl font-bold text-foreground">19,674.25</p>
                <p className="text-primary text-sm font-semibold">+1.45%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">SENSEX</p>
                <p className="text-xl font-bold text-foreground">65,834.10</p>
                <p className="text-primary text-sm font-semibold">+1.28%</p>
              </div>
            </div>
            {lastUpdated && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(lastUpdated, 'PPp')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Sections */}
        <div className="space-y-8">
          {trendingStocks.length > 0 && (
            <MarketSection title="Trending Stocks" stocks={trendingStocks} />
          )}
          {gainerStocks.length > 0 && (
            <MarketSection title="Top Gainers" stocks={gainerStocks} />
          )}
          {loserStocks.length > 0 && (
            <MarketSection title="Top Losers" stocks={loserStocks} />
          )}
          
          {!hasData && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No market data available</p>
              <Button onClick={refetch} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Fetch Data
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <BottomTabBar />
    </div>
  );
};

export default Market;