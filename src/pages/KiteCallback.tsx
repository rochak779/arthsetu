import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const API_BASE = "https://ideationally-bacterioscopic-hiroko.ngrok-free.dev";

interface CallbackResponse {
  status: string;
  user_id: string;
  broker_user_id?: string;
}

interface HoldingsResponse {
  user_id: string;
  holdings: any[];
}

const KiteCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse query params
        const requestToken = searchParams.get('request_token');
        const statusParam = searchParams.get('status');

        // Check for failed/cancelled login
        if (!requestToken || (statusParam && statusParam !== 'success')) {
          setStatus('error');
          setErrorMessage('Kite login failed or was cancelled');
          setLoading(false);
          return;
        }

        // Ensure user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setStatus('error');
          setErrorMessage('User not authenticated. Please log in and try again.');
          setLoading(false);
          return;
        }

        // Step 1: Exchange token with backend
        const callbackResponse = await fetch(
          `${API_BASE}/kite/callback?request_token=${requestToken}&user_id=${user.id}`,
          {
            headers: { 
              'ngrok-skip-browser-warning': 'true',
              'accept': 'application/json'
            }
          }
        );

        if (!callbackResponse.ok) {
          const errorText = await callbackResponse.text();
          let errorMsg = "Token exchange failed";
          
          if (callbackResponse.status === 422) {
            errorMsg = "Validation error - invalid request token";
          } else if (callbackResponse.status === 400) {
            errorMsg = "Missing user ID or invalid state";
          } else if (callbackResponse.status >= 500) {
            errorMsg = "Temporary server error. Please try again.";
          }
          
          setStatus('error');
          setErrorMessage(errorMsg);
          setLoading(false);
          return;
        }

        const callbackData: CallbackResponse = await callbackResponse.json();
        
        if (callbackData.status !== 'ok') {
          setStatus('error');
          setErrorMessage('Token exchange failed');
          setLoading(false);
          return;
        }

        // Step 2: Fetch holdings
        const holdingsResponse = await fetch(
          `${API_BASE}/kite/holdings?user_id=${user.id}`,
          {
            headers: { 
              'ngrok-skip-browser-warning': 'true',
              'accept': 'application/json'
            }
          }
        );

        if (!holdingsResponse.ok) {
          setStatus('error');
          setErrorMessage('Failed to fetch holdings from Kite');
          setLoading(false);
          return;
        }

        const holdingsData: HoldingsResponse = await holdingsResponse.json();

        // Step 3: Save holdings to Supabase
        if (holdingsData.holdings && holdingsData.holdings.length > 0) {
          // Clear existing holdings for this user
          await supabase
            .from('kite_holdings')
            .delete()
            .eq('user_id', user.id);

          // Insert new holdings
          const holdingsToInsert = holdingsData.holdings.map(holding => ({
            user_id: user.id,
            instrument_token: holding.instrument_token,
            exchange: holding.exchange,
            tradingsymbol: holding.tradingsymbol,
            product: holding.product,
            quantity: holding.quantity,
            average_price: holding.average_price,
            last_price: holding.last_price,
            pnl: holding.pnl,
            collateral_quantity: holding.collateral_quantity || 0,
            t1_quantity: holding.t1_quantity || 0,
            raw: holding
          }));

          const { error: insertError } = await supabase
            .from('kite_holdings')
            .insert(holdingsToInsert);

          if (insertError) {
            console.error('Error saving holdings to Supabase:', insertError);
            setStatus('error');
            setErrorMessage('Failed to save holdings to database');
            setLoading(false);
            return;
          }
        }

        // Success!
        setStatus('success');
        setLoading(false);
        
        toast({
          title: "Kite connected!",
          description: "Holdings synced successfully.",
        });

        // Navigate to portfolio/holdings view after a short delay
        setTimeout(() => {
          navigate('/portfolio');
        }, 2000);

      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/integration');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            {loading && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Processing Kite Connection
                </h2>
                <p className="text-muted-foreground">
                  Exchanging tokens and fetching your holdings...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Connection Successful!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your Kite account has been connected and holdings have been synced.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to your portfolio...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Connection Failed
                </h2>
                <p className="text-muted-foreground mb-6">
                  {errorMessage}
                </p>
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KiteCallback;