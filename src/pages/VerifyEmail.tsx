import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    // Check authentication state
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        setIsEmailVerified(true);
      }
    };

    checkAuthState();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          setIsEmailVerified(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleContinue = async () => {
    // Check current email verification status
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.email_confirmed_at) {
      navigate("/preferences");
    } else {
      toast({
        title: "Email not verified",
        description: "Please check your email and click the verification link before continuing.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Progress indicator */}
        <div>
          <p className="text-muted-foreground">Step 2 of 3</p>
        </div>
        
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-primary/10 p-6 rounded-full">
            <Mail className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Verify Your Email
        </h1>
        
        {/* Description */}
        <p className="text-lg text-muted-foreground">
          We've sent a verification link to your email. Please click it to verify your account and continue.
        </p>
        
        {isEmailVerified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="text-green-800 text-center">
              ✅ Email verified! You can now continue.
            </p>
          </div>
        )}
        
        {/* Buttons */}
        <div className="space-y-4 pt-8">
          <Button 
            onClick={handleContinue} 
            className="w-full h-14 text-lg font-semibold"
          >
            Continue
          </Button>
          
          <Button 
            onClick={handleCancel}
            variant="outline" 
            className="w-full h-14 text-lg font-semibold bg-transparent border-accent text-accent hover:bg-accent/10"
          >
            Back to Signup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;