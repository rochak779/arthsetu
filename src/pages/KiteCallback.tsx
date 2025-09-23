import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";



interface CallbackResponse {
  status: string;
  user_id: string;
  broker_user_id?: string;
  access_token?: string;
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

        // Step 1: Exchange request token for access token using Supabase Edge Function
        const { data: callbackData, error: callbackError } = await supabase.functions.invoke('kite-callback', {
          body: {
            request_token: requestToken,
            user_id: user.id
          }
        });

        if (callbackError || !callbackData) {
          setStatus('error');
          setErrorMessage(callbackError?.message || 'Token exchange failed');
          setLoading(false);
          return;
        }

        if (callbackData.status !== 'success') {
          setStatus('error');
          setErrorMessage('Token exchange failed');
          setLoading(false);
          return;
        }

        // Step 2: Fetch holdings using the access token
        const { data: holdingsData, error: holdingsError } = await supabase.functions.invoke('kite-holdings', {
          body: { user_id: user.id }
        });

        if (holdingsError) {
          console.error('Error fetching holdings:', holdingsError);
          // Don't fail the entire process if holdings fetch fails
        } else if (holdingsData?.status === 'success') {
          console.log(`Successfully fetched ${holdingsData.holdings_count || 0} holdings`);
        }

        // Access token and last login date already updated above

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