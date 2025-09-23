import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useKiteIntegration } from "@/hooks/useKiteIntegration";
import { Loader2 } from "lucide-react";
const Integration = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { connectToKite, retryFetchHoldings, isConnecting, isPolling } = useKiteIntegration();

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleConnect = (platform: string) => {
    if (platform === 'Kite' && user) {
      connectToKite(user.id);
    } else {
      console.log(`Connecting to ${platform}`);
    }
  };
  const handleSkip = () => {
    navigate("/dashboard");
  };
  return <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Progress indicator */}
        <div className="text-center">
          <p className="text-muted-foreground">Step 4 of 4</p>
        </div>
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Connect Your Trading Account
          </h1>
          <p className="text-muted-foreground">
            Choose your preferred trading platform
          </p>
        </div>
        
        {/* Integration Options */}
        <div className="space-y-4">
          {/* Kite */}
          <Card className="bg-card border-border relative">
            <CardContent className="p-6">
              <div className="absolute top-3 right-3">
                
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Kite (Zerodha)</h3>
                  <p className="text-muted-foreground text-sm">India's largest broker</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">K</span>
                </div>
              </div>
              <Button 
                onClick={() => handleConnect('Kite')} 
                disabled={isConnecting || loading || !user}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isPolling ? 'Fetching Holdings...' : 'Connecting...'}
                  </>
                ) : !user ? (
                  'Please log in to connect'
                ) : (
                  'Connect to Kite'
                )}
              </Button>
              {isConnecting && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isPolling ? 'Waiting for holdings data...' : 'Opening Kite authentication...'}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => user && retryFetchHoldings(user.id)}
                    className="mt-1 text-xs"
                  >
                    Retry fetch holdings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Groww */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Groww</h3>
                  <p className="text-muted-foreground text-sm">Simple & trusted</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">G</span>
                </div>
              </div>
              <Button onClick={() => handleConnect('Groww')} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white">
                Connect to Groww
              </Button>
            </CardContent>
          </Card>

          {/* Upstox */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Upstox</h3>
                  <p className="text-muted-foreground text-sm">Advanced tools</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">U</span>
                </div>
              </div>
              <Button onClick={() => handleConnect('Upstox')} className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white">
                Connect to Upstox
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Skip Button */}
        <div className="pt-6 text-center">
          <Button onClick={handleSkip} variant="ghost" className="text-accent hover:text-accent/90 hover:bg-transparent">
            Skip, proceed with sample data
          </Button>
        </div>
      </div>
    </div>;
};
export default Integration;