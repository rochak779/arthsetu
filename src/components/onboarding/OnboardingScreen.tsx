import { ReactNode } from "react";

interface OnboardingScreenProps {
  icon: ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  showDisclaimer?: boolean;
}

const OnboardingScreen = ({ 
  icon, 
  title, 
  description, 
  isActive,
  showDisclaimer = false 
}: OnboardingScreenProps) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen px-6 py-12 transition-all duration-500 ${
      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
    }`}>
      {/* Icon with animation */}
      <div className={`mb-8 transform transition-all duration-700 delay-200 ${
        isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      }`}>
        <div className="relative">
          {icon}
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
        </div>
      </div>

      {/* Title */}
      <h2 className={`text-2xl md:text-3xl font-bold text-foreground text-center mb-6 transform transition-all duration-700 delay-300 ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {title}
      </h2>

      {/* Description */}
      <p className={`text-lg text-muted-foreground text-center max-w-md leading-relaxed transform transition-all duration-700 delay-400 ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        {description}
      </p>

      {/* Disclaimer for final screen */}
      {showDisclaimer && (
        <div className={`mt-8 p-4 bg-warning/10 border border-warning/20 rounded-lg max-w-md transform transition-all duration-700 delay-500 ${
          isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="text-warning text-xl">⚠️</div>
            <div>
              <p className="text-sm text-warning-foreground font-medium mb-1">
                Important Disclaimer
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All suggestions are AI-powered insights. Please conduct your own analysis before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingScreen;