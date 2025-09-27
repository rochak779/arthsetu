import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";
import { TrendingUp, TrendingDown, RefreshCw, MessageSquare } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { format } from "date-fns";
import { useIndices } from "@/hooks/useIndices";
import logo from "@/assets/logo007.svg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
  const { nifty, sensex, lastUpdated: idxUpdated, loading: idxLoading, error: idxError, refetch: refetchIdx } = useIndices();

  // Market Sentiments state
  type SentimentRow = Tables<"market_sentiments">;
  const [sentimentSymbol, setSentimentSymbol] = useState("HDFCBANK");
  const [sentiments, setSentiments] = useState<SentimentRow[]>([]);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);

  const loadSentiments = async (sym: string) => {
    const { data, error } = await supabase
      .from("market_sentiments")
      .select("*")
      .eq("symbol", sym.toUpperCase())
      .order("tweet_created_at", { ascending: false })
      .limit(20);
    if (error) setSentimentError(error.message);
    else setSentiments(data || []);
  };

  useEffect(() => {
    loadSentiments(sentimentSymbol);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeSentiments = async () => {
    setSentimentLoading(true);
    setSentimentError(null);
    try {
      const { error } = await supabase.functions.invoke("analyze-market-sentiments", {
        body: { symbol: sentimentSymbol.toUpperCase(), max: 20 },
      });
      if (error) throw error;
      await loadSentiments(sentimentSymbol);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSentimentError(msg);
    } finally {
      setSentimentLoading(false);
    }
  };

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
  <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="App logo" className="h-16 w-32 object-contain" />
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
                <p className="text-sm text-muted-foreground">NIFTY</p>
                <p className="text-xl font-bold text-foreground">
                  {idxLoading ? '—' : nifty?.price?.toLocaleString('en-IN') ?? '—'}
                </p>
                <p className={`${(nifty?.changePct ?? 0) >= 0 ? 'text-primary' : 'text-destructive'} text-sm font-semibold`}>
                  {idxLoading || nifty == null ? '—' : `${nifty.changePct >= 0 ? '+' : ''}${nifty.changePct.toFixed(2)}%`}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">SENSEX</p>
                <p className="text-xl font-bold text-foreground">
                  {idxLoading ? '—' : sensex?.price?.toLocaleString('en-IN') ?? '—'}
                </p>
                <p className={`${(sensex?.changePct ?? 0) >= 0 ? 'text-primary' : 'text-destructive'} text-sm font-semibold`}>
                  {idxLoading || sensex == null ? '—' : `${sensex.changePct >= 0 ? '+' : ''}${sensex.changePct.toFixed(2)}%`}
                </p>
              </div>
            </div>
            {(idxUpdated || lastUpdated) && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(idxUpdated ?? lastUpdated!, 'PPp')}
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

          {/* Market Sentiments Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Market Sentiments
            </h2>
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={sentimentSymbol}
                    onChange={(e) => setSentimentSymbol(e.target.value)}
                    className="border rounded px-3 py-2 w-48 bg-background text-foreground"
                    placeholder="Symbol (e.g., HDFCBANK)"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sentimentLoading || !sentimentSymbol.trim()}
                    onClick={analyzeSentiments}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${sentimentLoading ? 'animate-spin' : ''}`} />
                    {sentimentLoading ? "Analyzing..." : "Analyze market sentiments"}
                  </Button>
                  {sentimentError && (
                    <span className="text-xs text-destructive">{sentimentError}</span>
                  )}
                </div>

                <div className="space-y-2">
                  {sentiments.map((r) => (
                    <Card key={r.tweet_id} className="bg-card/80 border-border">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            r.sentiment_label === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                            r.sentiment_label === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {r.sentiment_label}
                          </span>
                          <time className="text-[10px] text-muted-foreground">
                            {new Date(r.tweet_created_at).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{r.tweet_text}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                          <a
                            className="text-primary hover:underline"
                            href={`https://twitter.com/i/web/status/${r.tweet_id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on Twitter
                          </a>
                          <span>Score: {Number(r.sentiment_score ?? 0).toFixed(2)}</span>
                          <span>Model: {r.model}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {sentiments.length === 0 && (
                    <Card className="bg-card/80 border-border">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        No sentiments yet for {sentimentSymbol.toUpperCase()}. Try analyzing.
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
      
      <BottomTabBar />
    </div>
  );
};

export default Market;