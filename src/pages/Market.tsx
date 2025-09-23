import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomTabBar from "@/components/BottomTabBar";
import { TrendingUp, TrendingDown } from "lucide-react";
const Market = () => {
  const topGainers = [{
    stock: "ADANIENT",
    price: 2847.50,
    change: 8.45
  }, {
    stock: "TATAMOTORS",
    price: 776.20,
    change: 6.78
  }, {
    stock: "BAJFINANCE",
    price: 6890.30,
    change: 5.42
  }, {
    stock: "HINDUNILVR",
    price: 2456.80,
    change: 4.89
  }];
  const topLosers = [{
    stock: "BHARTIARTL",
    price: 1547.60,
    change: -3.24
  }, {
    stock: "WIPRO",
    price: 574.90,
    change: -2.87
  }, {
    stock: "TECHM",
    price: 1689.40,
    change: -2.45
  }, {
    stock: "INFY",
    price: 1834.20,
    change: -1.98
  }];
  const nifty50 = [{
    stock: "RELIANCE",
    price: 2890.45,
    change: 1.23
  }, {
    stock: "TCS",
    price: 4156.80,
    change: 0.89
  }, {
    stock: "ICICIBANK",
    price: 1247.30,
    change: 2.15
  }, {
    stock: "HDFCBANK",
    price: 1687.50,
    change: -0.45
  }, {
    stock: "ITC",
    price: 456.20,
    change: 1.87
  }];
  const watchlist = [{
    stock: "AAPL",
    price: 175.50,
    change: 2.34
  }, {
    stock: "GOOGL",
    price: 2847.60,
    change: 1.78
  }, {
    stock: "TSLA",
    price: 245.80,
    change: -1.45
  }, {
    stock: "MSFT",
    price: 320.50,
    change: 0.92
  }];
  const StockCard = ({
    stock,
    price,
    change
  }: {
    stock: string;
    price: number;
    change: number;
  }) => <Card className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">{stock}</h3>
            <p className="text-sm text-muted-foreground">₹{price.toFixed(2)}</p>
          </div>
          <div className={`flex items-center gap-1 ${change > 0 ? 'text-primary' : 'text-destructive'}`}>
            {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-semibold text-sm">
              {change > 0 ? '+' : ''}{change}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>;
  const MarketSection = ({
    title,
    stocks
  }: {
    title: string;
    stocks: Array<{
      stock: string;
      price: number;
      change: number;
    }>;
  }) => <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2">
        {stocks.map(item => <StockCard key={item.stock} {...item} />)}
      </div>
    </div>;
  return <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/src/assets/logo.svg" alt="ArthSetu" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">ArthSetu</span>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-foreground">Market</h1>
            
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
          </CardContent>
        </Card>

        {/* Market Sections */}
        <div className="space-y-8">
          <MarketSection title="Watchlist" stocks={watchlist} />
          <MarketSection title="Top Gainers" stocks={topGainers} />
          <MarketSection title="Top Losers" stocks={topLosers} />
          <MarketSection title="Nifty 50" stocks={nifty50} />
        </div>
      </div>
      
      <BottomTabBar />
    </div>;
};
export default Market;