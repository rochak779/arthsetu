import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomTabBar from "@/components/BottomTabBar";
import { TrendingUp, TrendingDown } from "lucide-react";

const Portfolio = () => {
  const portfolioData = {
    totalValue: 125840.50,
    totalInvested: 100000,
    profit: 25840.50,
    profitPercentage: 25.84
  };

  const holdings = [
    {
      id: 1,
      stock: "AAPL",
      currentValue: 45000,
      investedAmount: 40000,
      avgPrice: 175.50,
      shares: 228,
      change: 12.5
    },
    {
      id: 2,
      stock: "GOOGL", 
      currentValue: 38500,
      investedAmount: 35000,
      avgPrice: 2850.75,
      shares: 13,
      change: 10.0
    },
    {
      id: 3,
      stock: "TSLA",
      currentValue: 28340.50,
      investedAmount: 25000,
      avgPrice: 245.80,
      shares: 115,
      change: 13.36
    },
    {
      id: 4,
      stock: "MSFT",
      currentValue: 14000,
      investedAmount: 15000,
      avgPrice: 320.50,
      shares: 44,
      change: -6.67
    }
  ];

  const sectorData = [
    { sector: "Technology", percentage: 65, color: "bg-tertiary" },
    { sector: "Healthcare", percentage: 20, color: "bg-accent" },
    { sector: "Finance", percentage: 15, color: "bg-warning" }
  ];

  const timeFilters = ["1D", "1W", "1M", "1Y", "All"];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/src/assets/logo.svg" alt="ArthSetu" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">ArthSetu</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Portfolio</h1>
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
              <div>
                <p className="text-sm text-[#B0B0B0]">Total Invested</p>
                <p className="text-xl font-semibold text-foreground">
                  ₹{portfolioData.totalInvested.toLocaleString()}
                </p>
              </div>
              <div className="col-span-2 flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-[#B0B0B0]">Profit/Loss</p>
                  <p className={`text-xl font-bold ${portfolioData.profit > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {portfolioData.profit > 0 ? '+' : ''}₹{portfolioData.profit.toLocaleString()}
                  </p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                  portfolioData.profitPercentage > 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                }`}>
                  {portfolioData.profitPercentage > 0 ? 
                    <TrendingUp className="h-4 w-4" /> : 
                    <TrendingDown className="h-4 w-4" />
                  }
                  <span className="font-semibold">
                    {portfolioData.profitPercentage > 0 ? '+' : ''}{portfolioData.profitPercentage}%
                  </span>
                </div>
              </div>
            </div>
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

            {/* Performance Chart Placeholder */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Performance</h3>
                <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-secondary">Performance chart coming soon</p>
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
                      <span className="text-secondary font-medium">{sector.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holdings" className="mt-6">
            <div className="space-y-3">
              {holdings.map((holding) => (
                <Card key={holding.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{holding.stock}</h3>
                        <p className="text-sm text-[#B0B0B0]">{holding.shares} shares</p>
                      </div>
                      <div className={`text-right ${holding.change > 0 ? 'text-primary' : 'text-destructive'}`}>
                        <p className="font-semibold">
                          {holding.change > 0 ? '+' : ''}{holding.change}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#B0B0B0]">Current Value</p>
                        <p className="font-semibold text-foreground">₹{holding.currentValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#B0B0B0]">Invested</p>
                        <p className="font-semibold text-foreground">₹{holding.investedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#B0B0B0]">Avg Price</p>
                        <p className="font-semibold text-foreground">₹{holding.avgPrice}</p>
                      </div>
                      <div>
                        <p className="text-[#B0B0B0]">P&L</p>
                        <p className={`font-semibold ${holding.currentValue > holding.investedAmount ? 'text-primary' : 'text-destructive'}`}>
                          ₹{(holding.currentValue - holding.investedAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomTabBar />
    </div>
  );
};

export default Portfolio;