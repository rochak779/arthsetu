import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoginUrlResponse {
  login_url: string;
}

export const useKiteIntegration = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const connectToKite = async (userId: string) => {
    setIsConnecting(true);

    try {
      // Ensure user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get Kite login URL from Supabase Edge Function
      const { data: loginData, error: loginError } = await supabase.functions.invoke('kite-login-url', {
        body: { user_id: userId }
      });

      if (loginError || !loginData) {
        throw new Error(loginError?.message || 'Failed to get login URL');
      }
      
      if (!loginData.login_url) {
        throw new Error('No login URL received');
      }

      // Redirect to Kite login (full page redirect)
      window.location.href = loginData.login_url;

    } catch (error) {
      console.error('Error connecting to Kite:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to Kite",
        variant: "destructive",
      });
    }
  };

  return {
    connectToKite,
    isConnecting
  };
};