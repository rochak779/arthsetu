import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Preferences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    investorType: "",
    riskComfort: "",
    alertPreferences: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!preferences.investorType || !preferences.riskComfort || !preferences.alertPreferences) {
      toast({
        title: "Error",
        description: "Please fill in all preferences",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        navigate("/signup");
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: session.user.id,
          investor_type: preferences.investorType,
          risk_comfort: preferences.riskComfort,
          alert_pref: preferences.alertPreferences
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      navigate("/integration");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Progress indicator */}
        <div className="text-center">
          <p className="text-muted-foreground">Step 3 of 3</p>
        </div>
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Tell us about your investing style
          </h1>
          <p className="text-muted-foreground">
            Help us personalize your alerts
          </p>
        </div>
        
        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-foreground text-lg">Investor Type</Label>
            <Select onValueChange={(value) => setPreferences({ ...preferences, investorType: value })}>
              <SelectTrigger className="h-14 text-lg bg-card border-border">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="intraday">Intraday Trader</SelectItem>
                <SelectItem value="swing">Swing</SelectItem>
                <SelectItem value="longterm">Long-Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label className="text-foreground text-lg">Risk Comfort</Label>
            <Select onValueChange={(value) => setPreferences({ ...preferences, riskComfort: value })}>
              <SelectTrigger className="h-14 text-lg bg-card border-border">
                <SelectValue placeholder="Select your risk tolerance" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label className="text-foreground text-lg">Alert Preferences</Label>
            <Select onValueChange={(value) => setPreferences({ ...preferences, alertPreferences: value })}>
              <SelectTrigger className="h-14 text-lg bg-card border-border">
                <SelectValue placeholder="How often do you want alerts?" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="realtime">Real-time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Continue Button */}
          <div className="pt-6">
            <Button 
              onClick={handleContinue} 
              className="w-full h-14 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;