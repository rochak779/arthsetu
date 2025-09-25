import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { format } from "date-fns";
import logo from "@/assets/logo007.svg";

const Portfolio = () => {
  const { portfolioData, isLoading, isRefreshing, refreshPortfolio } = usePortfolioData();

  const handleBuyTrim = () => {
    window.open('https://kite.zerodha.com/', '_blank');
  };

  // Keep sector data for chart display
  const sectorData = [
    { sector: "Technology", percentage: 65, color: "bg-primary" },
    { sector: "Healthcare", percentage: 20, color: "bg-accent" },
    { sector: "Finance", percentage: 15, color: "bg-warning" }
  ];

  const timeFilters = ["1D", "1W", "1M", "1Y", "All"];

  const chartData = [
    { date: "Jan", value: 100000 },
    { date: "Feb", value: 105000 },
    { date: "Mar", value: 110000 },
    { date: "Apr", value: 108000 },
    { date: "May", value: 115000 },
    { date: "Jun", value: portfolioData.totalValue }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-8">
        {/* Header */}
  <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="App logo" className="h-16 w-32 object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">Portfolio</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshPortfolio}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Card */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#B0B0B0]">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{portfolioData.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#B0B0B0]">Total Invested</p>
                <p className="text-xl font-semibold text-foreground">
                  ₹{portfolioData.totalInvested.toLocaleString()}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-[#B0B0B0]">Profit/Loss</p>
                  <p className={`text-xl font-bold ${portfolioData.totalPnL > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {portfolioData.totalPnL > 0 ? '+' : ''}₹{portfolioData.totalPnL.toLocaleString()}
                  </p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  portfolioData.totalPnLPercent > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                }`}>
                  {portfolioData.totalPnLPercent > 0 ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  <span className="font-semibold">
                    {portfolioData.totalPnLPercent > 0 ? '+' : ''}{portfolioData.totalPnLPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            {portfolioData.lastUpdated && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(portfolioData.lastUpdated, 'PPp')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Time Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  className="px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-card/80 transition-colors whitespace-nowrap"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Performance Chart */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Performance</h3>
                <div className="h-48">
                  <LineChart width={300} height={180} data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </div>
              </CardContent>
            </Card>

            {/* Sector Allocation */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Sector Allocation</h3>
                <div className="space-y-3">
                  {sectorData.map((sector) => (
                    <div key={sector.sector} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${sector.color}`}></div>
                        <span className="text-foreground">{sector.sector}</span>
                      </div>
                      <span className="text-muted-foreground font-medium">{sector.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holdings" className="mt-6">
            <div className="space-y-3">
              {portfolioData.holdings.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No holdings found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Connect your trading account to view your portfolio
                    </p>
                  </CardContent>
                </Card>
              ) : (
                portfolioData.holdings.map((holding, index) => (
                  <Card key={index} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{holding.tradingsymbol}</h3>
                          <p className="text-sm text-[#B0B0B0]">{holding.quantity} shares</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-right ${holding.pnl > 0 ? 'text-primary' : 'text-destructive'}`}>
                            <p className="font-semibold">₹{holding.pnl.toLocaleString()}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleBuyTrim}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Buy/Trim
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[#B0B0B0]">Current Value</p>
                          <p className="font-semibold text-foreground">₹{(holding.last_price * holding.quantity).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[#B0B0B0]">Invested</p>
                          <p className="font-semibold text-foreground">₹{(holding.average_price * holding.quantity).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[#B0B0B0]">Avg Price</p>
                          <p className="font-semibold text-foreground">₹{holding.average_price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[#B0B0B0]">LTP</p>
                          <p className="font-semibold text-foreground">₹{holding.last_price.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomTabBar />
    </div>
  );
};

export default Portfolio;
