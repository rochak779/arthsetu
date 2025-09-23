import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const API_BASE = "https://ideationally-bacterioscopic-hiroko.ngrok-free.dev";

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

      // Get Kite login URL
      const loginUrlResponse = await fetch(`${API_BASE}/kite/login-url?user_id=${userId}`, {
        headers: { 
          'ngrok-skip-browser-warning': 'true',
          'accept': 'application/json'
        }
      });

      if (!loginUrlResponse.ok) {
        throw new Error('Failed to get login URL');
      }

      const loginData: LoginUrlResponse = await loginUrlResponse.json();
      
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