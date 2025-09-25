import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo007.svg";

interface OnboardingSplashProps {
  onComplete: () => void;
}

const OnboardingSplash = ({ onComplete }: OnboardingSplashProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Start animation
    setIsVisible(true);
    
    // Auto-advance after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30 animate-pulse" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Logo with scale-up animation */}
        <div 
          className={`transform transition-all duration-1000 ease-out ${
            isVisible 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-75 opacity-0 translate-y-4'
          }`}
        >
          <div className="relative">
            <img 
              src={logo} 
              alt="App logo" 
              className="h-24 w-auto"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 h-24 w-auto rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
        </div>

        {/* App name removed for logo-only branding */}

        {/* Tagline */}
        <div 
          className={`transform transition-all duration-1000 delay-500 ease-out ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-lg text-muted-foreground text-center">
            AI-Powered Market Intelligence
          </p>
        </div>

        {/* Loading indicator */}
        <div 
          className={`transform transition-all duration-1000 delay-700 ease-out ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex space-x-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        Skip
      </button>
    </div>
  );
};

export default OnboardingSplash;