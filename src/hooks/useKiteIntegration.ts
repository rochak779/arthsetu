import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KiteHolding {
  instrument_token: number;
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  product: string;
  collateral_quantity: number;
  t1_quantity: number;
}

export const useKiteIntegration = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  const KITE_API_BASE = "https://ideationally-bacterioscopic-hiroko.ngrok-free.dev";
  const POLL_INTERVAL = 3000; // 3 seconds
  const MAX_POLL_ATTEMPTS = 60; // 3 minutes max

  const connectToKite = useCallback(async (userId: string) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your Kite account.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Step 1: Get Kite login URL
      const loginUrlResponse = await fetch(`${KITE_API_BASE}/kite/login-url?user_id=${userId}`, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'accept': 'application/json'
        }
      });

      if (!loginUrlResponse.ok) {
        const errorText = await loginUrlResponse.text();
        throw new Error(`Failed to get Kite login URL: ${errorText}`);
      }

      const data = await loginUrlResponse.json();
      const login_url = data.login_url || data.url;

      // Step 2: Open popup for Kite authentication
      const popup = window.open(
        login_url,
        'kiteLogin',
        'width=600,height=700,scrollbars=yes,resizable=yes,centerscreen=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Step 3: Poll for holdings while popup is open
      setIsPolling(true);
      let pollAttempts = 0;
      let holdingsData = null;
      let accessToken = null;

      const checkForCallback = async (): Promise<string | null> => {
        try {
          // Check if popup URL contains request_token (indicating successful auth)
          const popupUrl = popup.location?.href;
          if (popupUrl && popupUrl.includes('request_token=')) {
            const urlParams = new URLSearchParams(popupUrl.split('?')[1]);
            return urlParams.get('request_token');
          }
        } catch (error) {
          // Cross-origin error is expected, ignore
        }
        return null;
      };

      const exchangeToken = async (requestToken: string): Promise<boolean> => {
        try {
          const callbackResponse = await fetch(`${KITE_API_BASE}/kite/callback?request_token=${requestToken}&user_id=${userId}`, {
            headers: { 
              'ngrok-skip-browser-warning': 'true',
              'accept': 'application/json'
            }
          });

          if (callbackResponse.ok) {
            const data = await callbackResponse.json();
            accessToken = data.access_token;
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error exchanging token:', error);
          return false;
        }
      };

      const pollHoldings = async (): Promise<boolean> => {
        try {
          const holdingsResponse = await fetch(`${KITE_API_BASE}/kite/holdings?user_id=${userId}`, {
            headers: { 
              'ngrok-skip-browser-warning': 'true',
              'accept': 'application/json'
            }
          });

          if (holdingsResponse.ok) {
            const data = await holdingsResponse.json();
            if (data.holdings && data.holdings.length > 0) {
              holdingsData = data.holdings;
              // Use token from exchange if available, otherwise from holdings response
              accessToken = accessToken || data.access_token;
              return true;
            }
          }
          return false;
        } catch (error) {
          console.error('Error polling holdings:', error);
          return false;
        }
      };

      let tokenExchanged = false;

      const pollInterval = setInterval(async () => {
        pollAttempts++;

        // Check if popup is closed
        if (popup.closed) {
          clearInterval(pollInterval);
          setIsPolling(false);
          setIsConnecting(false);
          
          if (!holdingsData) {
            toast({
              title: "Authentication Cancelled",
              description: "Kite authentication was cancelled or incomplete.",
              variant: "destructive",
            });
          }
          return;
        }

        // Check if max attempts reached
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
          clearInterval(pollInterval);
          popup.close();
          setIsPolling(false);
          setIsConnecting(false);
          
          toast({
            title: "Timeout",
            description: "Holdings fetch timed out. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // First, check for authentication callback and exchange token
        if (!tokenExchanged) {
          const requestToken = await checkForCallback();
          if (requestToken) {
            const exchangeSuccess = await exchangeToken(requestToken);
            if (exchangeSuccess) {
              tokenExchanged = true;
              toast({
                title: "Authentication Successful",
                description: "Fetching your holdings...",
              });
            }
          }
        }

        // Then poll for holdings
        const holdingsReady = await pollHoldings();
        
        if (holdingsReady && holdingsData) {
          clearInterval(pollInterval);
          popup.close();
          setIsPolling(false);
          
          // Step 4: Store holdings and access token in Supabase
          await storeHoldingsAndToken(userId, holdingsData, accessToken);
          setIsConnecting(false);
        }
      }, POLL_INTERVAL);

    } catch (error) {
      console.error('Kite connection error:', error);
      setIsConnecting(false);
      setIsPolling(false);
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Kite",
        variant: "destructive",
      });
    }
  }, [toast]);

  const storeHoldingsAndToken = async (userId: string, holdings: KiteHolding[], accessToken: string) => {
    try {
      // Update user with access token and last login date
      const { error: userError } = await supabase
        .from('users')
        .update({
          kite_accesstoken: accessToken,
          last_login_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (userError) throw userError;

      // Delete existing holdings for this user
      const { error: deleteError } = await supabase
        .from('kite_holdings')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new holdings
      const holdingsToInsert = holdings.map(holding => ({
        user_id: userId,
        instrument_token: holding.instrument_token,
        tradingsymbol: holding.tradingsymbol,
        exchange: holding.exchange,
        quantity: holding.quantity,
        average_price: holding.average_price,
        last_price: holding.last_price,
        pnl: holding.pnl,
        product: holding.product,
        collateral_quantity: holding.collateral_quantity,
        t1_quantity: holding.t1_quantity,
        raw: holding as any
      }));

      const { error: insertError } = await supabase
        .from('kite_holdings')
        .insert(holdingsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: `Connected to Kite successfully. ${holdings.length} holdings imported.`,
      });

      // Navigate to dashboard after successful integration
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Error storing holdings:', error);
      toast({
        title: "Storage Failed",
        description: "Holdings fetched but failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  const retryFetchHoldings = useCallback(async (userId: string) => {
    if (!userId) return;

    try {
      const holdingsResponse = await fetch(`${KITE_API_BASE}/kite/holdings?user_id=${userId}`, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'accept': 'application/json'
        }
      });

      if (holdingsResponse.ok) {
        const data = await holdingsResponse.json();
        if (data.holdings && data.holdings.length > 0) {
          await storeHoldingsAndToken(userId, data.holdings, data.access_token);
        } else {
          toast({
            title: "No Holdings Found",
            description: "No holdings available yet. Please complete Kite authentication first.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('Holdings not ready');
      }
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Unable to fetch holdings. Please try connecting again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    connectToKite,
    retryFetchHoldings,
    isConnecting,
    isPolling
  };
};