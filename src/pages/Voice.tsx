import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import BottomTabBar from '@/components/BottomTabBar';

const Voice = () => {
  const {
    isConnected,
    isListening,
    isSpeaking,
    isLoading,
    error,
    startConversation,
    endConversation,
    status,
  } = useElevenLabsVoice();

  // Status text for user feedback
  const getStatusText = () => {
    if (isLoading) return 'Connecting...';
    if (error) return `Error: ${error}`;
    if (isSpeaking) return 'AI is speaking...';
    if (isListening) return 'Listening...';
    if (isConnected) return 'Connected - Ready to talk';
    return 'Tap to start conversation';
  };

  // Status color for visual feedback
  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isSpeaking) return 'text-blue-500';
    if (isListening) return 'text-green-500';
    if (isConnected) return 'text-green-600';
    return 'text-muted-foreground';
  };

  // Main action button text
  const getButtonText = () => {
    if (isLoading) return 'Connecting...';
    if (isConnected || isListening) return 'End Conversation';
    return 'Start Voice Chat';
  };

  // Handle button click
  const handleButtonClick = () => {
    if (isConnected || isListening) {
      endConversation();
    } else {
      startConversation();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 pb-24">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Voice Assistant
          </h1>
          <p className="text-muted-foreground">
            Talk to your financial AI assistant
          </p>
        </div>

        {/* Main Voice Interface Card */}
        <Card className="mb-6 border-2 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-6">
              
              {/* Voice Status Indicator */}
              <div className="relative">
                <div className={`absolute inset-0 rounded-full ${
                  isSpeaking ? 'animate-pulse bg-blue-200' : 
                  isListening ? 'animate-pulse bg-green-200' : 
                  'bg-muted/20'
                } -m-4`} />
                
                <div className={`relative p-4 rounded-full ${
                  isSpeaking ? 'bg-blue-100' : 
                  isListening ? 'bg-green-100' : 
                  isConnected ? 'bg-green-50' :
                  'bg-muted/10'
                } transition-all duration-300`}>
                  {isSpeaking ? (
                    <Volume2 className="h-12 w-12 text-blue-600" />
                  ) : isListening ? (
                    <Mic className="h-12 w-12 text-green-600" />
                  ) : (
                    <MicOff className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center">
                <p className={`text-lg font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: {status}
                </p>
              </div>

              {/* Main Action Button */}
              <Button
                onClick={handleButtonClick}
                disabled={isLoading}
                size="lg"
                className={`w-full h-14 text-lg font-semibold transition-all duration-300 ${
                  isConnected || isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {getButtonText()}
                  </>
                ) : (
                  getButtonText()
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">
              How to use:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">1.</span>
                Tap "Start Voice Chat" to begin
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">2.</span>
                Speak naturally - the AI will respond automatically
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">3.</span>
                Ask about your portfolio, market data, or get insights
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-2">4.</span>
                Tap "End Conversation" when finished
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mt-4 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Voice;