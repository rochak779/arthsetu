import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsVoiceReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  startConversation: () => Promise<void>;
  endConversation: () => void;
  status: string;
}

export const useElevenLabsVoice = (): UseElevenLabsVoiceReturn => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('🔗 ElevenLabs conversation connected');
      setError(null);
      toast({
        title: "Connected",
        description: "Voice assistant is ready",
      });
    },
    onDisconnect: () => {
      console.log('🔌 ElevenLabs conversation disconnected');
      setIsListening(false);
      conversationIdRef.current = null;
    },
    onMessage: (message) => {
      console.log('📨 ElevenLabs message:', message);
      // Handle different message types if needed
    },
    onError: (error: string) => {
      console.error('❌ ElevenLabs error:', error);
      setError(error || 'Voice assistant error');
      toast({
        title: "Voice Error",
        description: error || 'Something went wrong with the voice assistant',
        variant: "destructive",
      });
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get signed URL from our Supabase edge function
      const { data, error: functionError } = await supabase.functions.invoke('elevenlabs-session');
      
      if (functionError) {
        throw new Error(functionError.message || 'Failed to get session URL');
      }
      
      if (!data?.signed_url) {
        throw new Error('No signed URL received from server');
      }

      // Start the conversation with the signed URL  
      const conversationId = await conversation.startSession({ 
        signedUrl: data.signed_url 
      });
      
      conversationIdRef.current = conversationId;
      setIsListening(true);
      
      console.log('🎤 Voice conversation started:', conversationId);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice conversation';
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversation, toast]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setIsListening(false);
      conversationIdRef.current = null;
      console.log('🛑 Voice conversation ended');
      
      toast({
        title: "Disconnected",
        description: "Voice conversation ended",
      });
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  }, [conversation, toast]);

  return {
    isConnected: conversation.status === 'connected',
    isListening,
    isSpeaking: conversation.isSpeaking || false,
    isLoading,
    error,
    startConversation,
    endConversation,
    status: conversation.status || 'disconnected',
  };
};