import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Primary: Parse Zerodha technicals data
const parseZerodhaData = async (): Promise<{ gainers: StockData[], losers: StockData[], trending: StockData[] }> => {
  try {
    console.log('Fetching data from Zerodha technicals (primary source)');
    
    const response = await fetch('https://technicals.zerodha.com/dashboard', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    });

    if (!response.ok) {
      throw new Error(`Zerodha fetch failed: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Zerodha HTML length: ${html.length}`);
    
    const allStocks: StockData[] = [];
    
    // Parse stock data from tables
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    if (tableMatches) {
      for (const table of tableMatches) {
        const rowMatches = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
        if (rowMatches) {
          for (const row of rowMatches) {
            const cellMatches = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (cellMatches && cellMatches.length >= 3) {
              try {
                const symbol = cellMatches[0].replace(/<[^>]*>/g, '').trim();
                const priceText = cellMatches[1].replace(/<[^>]*>/g, '').replace(/[₹,\s]/g, '');
                const changeText = cellMatches[2].replace(/<[^>]*>/g, '').trim();
                
                const price = parseFloat(priceText);
                const changeMatch = changeText.match(/([+-]?[\d.]+)/);
                const percentMatch = changeText.match(/([+-]?[\d.]+)%/);
                
                const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
                const changePercent = percentMatch ? parseFloat(percentMatch[1]) : 0;

                if (symbol && !isNaN(price) && price > 0 && symbol.length <= 20) {
                  allStocks.push({
                    symbol: symbol.toUpperCase(),
                    name: symbol,
                    price,
                    change,
                    changePercent
                  });
                }
              } catch (e) {
                continue;
              }
            }
          }
        }
      }
    }

    // Also try parsing any JSON-like data
    const jsonMatches = html.match(/"symbol":\s*"([^"]+)"[^}]*"ltp":\s*([0-9.]+)[^}]*"change":\s*([+-]?[0-9.]+)[^}]*"changePercent":\s*([+-]?[0-9.]+)/g);
    if (jsonMatches) {
      for (const match of jsonMatches) {
        const parsed = match.match(/"symbol":\s*"([^"]+)"[^}]*"ltp":\s*([0-9.]+)[^}]*"change":\s*([+-]?[0-9.]+)[^}]*"changePercent":\s*([+-]?[0-9.]+)/);
        if (parsed) {
          const [, symbol, price, change, changePercent] = parsed;
          allStocks.push({
            symbol: symbol.toUpperCase(),
            name: symbol,
            price: parseFloat(price),
            change: parseFloat(change),
            changePercent: parseFloat(changePercent)
          });
        }
      }
    }

    console.log(`Zerodha parsed ${allStocks.length} total stocks`);

    // Separate gainers, losers, and trending
    const gainers = allStocks
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 10);
    
    const losers = allStocks
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10);

    const trending = allStocks
      .slice(0, 15)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 10);

    return { gainers, losers, trending };
  } catch (error) {
    console.error('Error fetching Zerodha data:', error);
    throw error;
  }
};

// Fallback: Parse NSE data
const parseNSEStockData = (html: string): StockData[] => {
  const stocks: StockData[] = [];
  
  try {
    const patterns = [
      /"symbol":"([^"]+)"[^}]*"lastPrice":"?([0-9,.]+)"?[^}]*"change":"?([+-]?[0-9,.]+)"?[^}]*"pChange":"?([+-]?[0-9,.]+)"?/g,
      /data-symbol="([^"]+)"[^>]*>.*?₹\s*([0-9,.]+).*?([+-]?[0-9,.]+)\s*\(([+-]?[0-9,.]+)%\)/gs,
      /\/get-quotes\/equity\?symbol=([A-Z0-9&]+)[^>]*>([^<]+)<.*?([0-9,.]+).*?([+-]?[0-9,.]+).*?\(([+-]?[0-9,.]+)%\)/gs
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && stocks.length < 25) {
        let symbol, name, price, change, changePercent;
        
        if (pattern.source.includes('symbol":"')) {
          [, symbol, price, change, changePercent] = match;
          name = symbol;
        } else if (pattern.source.includes('data-symbol')) {
          [, symbol, price, change, changePercent] = match;
          name = symbol;
        } else {
          [, symbol, name, price, change, changePercent] = match;
        }
        
        const priceNum = parseFloat(price.replace(/[,₹\s]/g, ''));
        const changeNum = parseFloat(change.replace(/[,₹\s]/g, ''));
        const changePercentNum = parseFloat(changePercent.replace(/[,%\s]/g, ''));
        
        if (!isNaN(priceNum) && symbol && !stocks.find(s => s.symbol === symbol)) {
          stocks.push({
            symbol: symbol.replace(/[&]/g, '').trim(),
            name: (name || symbol).replace(/[&]/g, '').trim(),
            price: priceNum,
            change: changeNum || 0,
            changePercent: changePercentNum || 0
          });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing NSE data:', error);
  }
  
  return stocks;
};

const scrapeGainersLosers = async (): Promise<{ gainers: StockData[], losers: StockData[] }> => {
  try {
    // Primary: Try Zerodha
    console.log('Fetching gainers/losers from Zerodha (primary)');
    const zerodhaData = await parseZerodhaData();
    
    if (zerodhaData.gainers.length > 0 || zerodhaData.losers.length > 0) {
      console.log(`Zerodha success: ${zerodhaData.gainers.length} gainers, ${zerodhaData.losers.length} losers`);
      return { gainers: zerodhaData.gainers, losers: zerodhaData.losers };
    }
  } catch (error) {
    console.log('Zerodha gainers/losers failed:', error.message);
  }

  // Fallback: Try NSE
  try {
    console.log('Falling back to NSE for gainers/losers');
    
    const response = await fetch('https://www.nseindia.com/market-data/top-gainers-losers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      const allStocks = parseNSEStockData(html);
      
      if (allStocks.length > 0) {
        const gainers = allStocks
          .filter(stock => stock.changePercent > 0)
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 10);
        
        const losers = allStocks
          .filter(stock => stock.changePercent < 0)
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, 10);
        
        console.log(`NSE fallback success: ${gainers.length} gainers, ${losers.length} losers`);
        return { gainers, losers };
      }
    }
  } catch (error) {
    console.log('NSE fallback also failed:', error.message);
  }

  // No dummy data - return empty arrays
  console.log('All sources failed for gainers/losers');
  return { gainers: [], losers: [] };
};

const scrapeNiftyData = async (): Promise<StockData[]> => {
  try {
    // Primary: Try Zerodha for trending
    console.log('Fetching trending data from Zerodha (primary)');
    const zerodhaData = await parseZerodhaData();
    
    if (zerodhaData.trending.length > 0) {
      console.log(`Zerodha trending success: ${zerodhaData.trending.length} stocks`);
      return zerodhaData.trending;
    }
  } catch (error) {
    console.log('Zerodha trending failed:', error.message);
  }

  // Fallback: Try NSE
  try {
    console.log('Falling back to NSE for trending data');
    
    const response = await fetch('https://www.nseindia.com/market-data/top-gainers-losers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      const stocks = parseNSEStockData(html);
      
      if (stocks.length > 0) {
        console.log(`NSE fallback success: ${stocks.length} trending stocks`);
        return stocks.slice(0, 10);
      }
    }
  } catch (error) {
    console.log('NSE trending fallback also failed:', error.message);
  }

  // No dummy data - return empty array
  console.log('All sources failed for trending data');
  return [];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint } = await req.json();
    console.log(`Processing request for endpoint: ${endpoint}`);

    let result: any;

    switch (endpoint) {
      case 'trending':
        const trendingData = await scrapeNiftyData();
        result = { trending: trendingData };
        break;

      case 'gainers-losers':
        const gainersLosersData = await scrapeGainersLosers();
        result = gainersLosersData;
        break;

      case 'all':
        console.log('Fetching all market data...');
        const [trending, gainersLosers] = await Promise.all([
          scrapeNiftyData(),
          scrapeGainersLosers()
        ]);
        
        result = {
          trending,
          gainers: gainersLosers.gainers,
          losers: gainersLosers.losers
        };
        break;

      default:
        throw new Error('Invalid endpoint');
    }

    // Check if we have any meaningful data
    const hasData = (result.trending && result.trending.length > 0) ||
                   (result.gainers && result.gainers.length > 0) ||
                   (result.losers && result.losers.length > 0);

    if (!hasData) {
      throw new Error('No market data available from any source');
    }

    console.log('Market data fetched successfully:', {
      trending: result.trending?.length || 0,
      gainers: result.gainers?.length || 0,
      losers: result.losers?.length || 0
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nse-market-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to fetch market data' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});