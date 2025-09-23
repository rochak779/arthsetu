import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomTabBar from "@/components/BottomTabBar";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.svg";

interface UserProfile {
  full_name: string;
  email: string;
  kite_accesstoken: string | null;
}

interface UserPreferences {
  investor_type: string;
  risk_comfort: string;
  alert_pref: string;
}

const Settings = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Error",
          description: "Please log in to view settings",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, kite_accesstoken')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setUserProfile(profileData);
      }

      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('investor_type, risk_comfort, alert_pref')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferencesError) {
        console.error('Error fetching preferences:', preferencesError);
      } else {
        setPreferences(preferencesData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    navigate('/integrations');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="ArthSetu" className="h-8 w-8" />
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
                <h2 className="text-lg font-semibold text-foreground">{userProfile?.full_name || 'User'}</h2>
                <p className="text-muted-foreground">{userProfile?.email || 'No email'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences Section */}
        {preferences ? (
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Preferences</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Investor Type</span>
                  <span className="text-foreground font-medium">{preferences.investor_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk Comfort</span>
                  <span className="text-foreground font-medium">{preferences.risk_comfort}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Alert Preference</span>
                  <span className="text-foreground font-medium">{preferences.alert_pref}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Preferences</h3>
              <p className="text-muted-foreground">No preferences set. Complete your profile to see preferences here.</p>
            </CardContent>
          </Card>
        )}

        {/* Connections Section */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Connections</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Kite</span>
                {userProfile?.kite_accesstoken ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-primary text-sm">Connected</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary h-auto p-1"
                    onClick={() => handleConnect('kite')}
                  >
                    Connect
                  </Button>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Groww</span>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary h-auto p-1"
                  onClick={() => handleConnect('groww')}
                >
                  Connect
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Upstox</span>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary h-auto p-1"
                  onClick={() => handleConnect('upstox')}
                >
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="fixed bottom-24 left-6 right-6">
          <Button 
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            size="lg"
            onClick={handleLogout}
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