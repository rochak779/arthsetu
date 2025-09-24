import { useState } from "react";
import OnboardingSplash from "@/components/onboarding/OnboardingSplash";
import OnboardingCarousel from "@/components/onboarding/OnboardingCarousel";

const Onboarding = () => {
  const [showCarousel, setShowCarousel] = useState(false);

  const handleSplashComplete = () => {
    setShowCarousel(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {showCarousel ? (
        <OnboardingCarousel />
      ) : (
        <OnboardingSplash onComplete={handleSplashComplete} />
      )}
    </div>
  );
};

export default Onboarding;