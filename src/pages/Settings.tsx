import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomTabBar from "@/components/BottomTabBar";
import { User, LogOut } from "lucide-react";

const Settings = () => {
  const userProfile = {
    name: "John Doe",
    email: "john.doe@example.com"
  };

  const preferences = {
    investorType: "Intermediate",
    riskComfort: "Medium", 
    alertPreference: "Real-time"
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/src/assets/logo.svg" alt="ArthSetu" className="h-8 w-8" />
          <span className="text-xl font-bold text-foreground">ArthSetu</span>
        </div>

        {/* User Profile Section */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{userProfile.name}</h2>
                <p className="text-muted-foreground">{userProfile.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences Section */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Preferences</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Investor Type</span>
                <span className="text-foreground font-medium">{preferences.investorType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Risk Comfort</span>
                <span className="text-foreground font-medium">{preferences.riskComfort}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Alert Preference</span>
                <span className="text-foreground font-medium">{preferences.alertPreference}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="fixed bottom-24 left-6 right-6">
          <Button 
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            size="lg"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      <BottomTabBar />
    </div>
  );
};

export default Settings;