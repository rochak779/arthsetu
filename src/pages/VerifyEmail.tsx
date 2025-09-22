import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/preferences");
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
          Verify your email by clicking on the link in your email.
        </p>
        
        {/* Buttons */}
        <div className="space-y-4 pt-8">
          <Button onClick={handleContinue} className="w-full h-14 text-lg font-semibold">
            I've verified
          </Button>
          
          <Button 
            onClick={handleCancel}
            variant="outline" 
            className="w-full h-14 text-lg font-semibold bg-transparent border-accent text-accent hover:bg-accent/10"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;