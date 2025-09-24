import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('arthsetu_onboarding_completed');
    
    if (hasCompletedOnboarding) {
      // Returning user - go to landing
      navigate("/landing");
    } else {
      // New user - start onboarding
      navigate("/onboarding");
    }
  }, [navigate]);

  return null;
};

export default Index;
