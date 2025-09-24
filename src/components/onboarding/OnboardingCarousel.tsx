import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Brain, TrendingUp, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingScreen from "./OnboardingScreen";

const OnboardingCarousel = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigate = useNavigate();

  const screens = [
    {
      icon: (
        <div className="relative">
          <div className="h-24 w-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          {/* Floating data points animation */}
          <div className="absolute -top-2 -right-2 h-4 w-4 bg-status-buy rounded-full animate-pulse" />
          <div className="absolute -bottom-2 -left-2 h-3 w-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-4 -left-4 h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      ),
      title: "AI-Powered Market Intelligence",
      description: "Our AI analyzes thousands of market signals to give you the edge you need in volatile markets."
    },
    {
      icon: (
        <div className="relative">
          <div className="h-24 w-24 bg-gradient-to-br from-status-buy/20 to-status-trim/20 rounded-full flex items-center justify-center">
            <TrendingUp className="h-12 w-12 text-status-buy" />
          </div>
          {/* Confidence meter animation */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div className="h-1 w-8 bg-status-buy rounded-full" />
            <div className="h-1 w-6 bg-status-trim rounded-full" />
            <div className="h-1 w-4 bg-status-hold rounded-full" />
          </div>
        </div>
      ),
      title: "Smart Buy/Sell Recommendations",
      description: "Get personalized recommendations tailored to your portfolio and risk profile with confidence scores."
    },
    {
      icon: (
        <div className="relative">
          <div className="h-24 w-24 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center">
            <Bell className="h-12 w-12 text-accent" />
          </div>
          {/* Notification pulse animation */}
          <div className="absolute -top-1 -right-1 h-6 w-6 bg-destructive rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xs text-white font-bold">3</span>
          </div>
          <div className="absolute inset-0 h-24 w-24 border-2 border-accent/30 rounded-full animate-ping" />
        </div>
      ),
      title: "Real-Time Personalized Alerts",
      description: "Stay ahead with instant alerts on your holdings before major market moves impact your portfolio."
    },
    {
      icon: (
        <div className="relative">
          <div className="h-24 w-24 bg-gradient-to-br from-warning/20 to-destructive/20 rounded-full flex items-center justify-center">
            <Shield className="h-12 w-12 text-warning" />
          </div>
          {/* Security badge animation */}
          <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">AI</span>
          </div>
        </div>
      ),
      title: "Stay Ahead with AI",
      description: "Ready to transform your investment strategy with AI-powered insights and real-time market intelligence?",
      showDisclaimer: true
    }
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // Mark onboarding as completed and navigate to signup
      localStorage.setItem('arthsetu_onboarding_completed', 'true');
      navigate('/signup');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('arthsetu_onboarding_completed', 'true');
    navigate('/signup');
  };

  // Handle swipe gestures (basic implementation)
  useEffect(() => {
    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      endX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (startX - endX > 50) {
        // Swipe left - next
        handleNext();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentScreen]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card/10 to-background" />
      
      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-2">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentScreen 
                  ? 'w-8 bg-primary' 
                  : index < currentScreen 
                    ? 'w-4 bg-primary/60'
                    : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-8 right-6 text-muted-foreground hover:text-foreground transition-colors duration-200 z-20"
      >
        Skip
      </button>

      {/* Main content area */}
      <div className="relative z-10">
        {screens.map((screen, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              index === currentScreen 
                ? 'translate-x-0 opacity-100' 
                : index < currentScreen 
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
            }`}
          >
            <OnboardingScreen
              icon={screen.icon}
              title={screen.title}
              description={screen.description}
              isActive={index === currentScreen}
              showDisclaimer={screen.showDisclaimer}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="absolute bottom-8 left-0 right-0 px-6 z-20">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {/* Back button (hidden on first screen) */}
          <button
            onClick={() => currentScreen > 0 && setCurrentScreen(currentScreen - 1)}
            className={`text-muted-foreground hover:text-foreground transition-all duration-200 ${
              currentScreen === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            ← Back
          </button>

          {/* Next/Get Started button */}
          <Button
            onClick={handleNext}
            className="flex items-center space-x-2 px-8 py-3 text-lg font-semibold"
          >
            <span>{currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;