import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomTabBar from "@/components/BottomTabBar";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo007.svg";

interface UserProfile {
  full_name: string;
  email: string;
  kite_accesstoken: string | null;
  groww_accesstoken: string | null;
  upstox_accesstoken: string | null;
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
    // Set up auth state listener - only for actual sign out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Settings: Auth state change:', event, !!session);
      if (event === 'SIGNED_OUT') {
        // Only redirect on actual logout
        navigate("/login");
      }
    });

    // Initial data fetch
    fetchUserData();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log('Settings: Starting fetchUserData');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Settings: getSession result:', { hasSession: !!session, sessionError, userId: session?.user?.id });

      if (sessionError) {
        console.error('Settings: getSession error:', sessionError);
        toast({
          title: "Session Error",
          description: "Could not verify your login status",
          variant: "destructive",
        });
        return;
      }

      if (!session?.user) {
        console.log('Settings: No active session found');
        toast({
          title: "Not Logged In",
          description: "Please log in to view your settings",
          variant: "destructive",
        });
        return;
      }

      const userId = session.user.id;
      console.log('Settings: User ID from session:', userId);

      // Fetch user profile with detailed logging
      console.log('Settings: Fetching user profile from database...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, kite_accesstoken, groww_accesstoken, upstox_accesstoken')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Settings: Profile fetch result:', { 
        profileData, 
        profileError,
        hasData: !!profileData,
        email: profileData?.email 
      });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast({
          title: "Database Error", 
          description: `Could not load profile: ${profileError.message}`,
          variant: "destructive",
        });
      } else if (!profileData) {
        console.log('Settings: No profile found in database for user:', userId);
        toast({
          title: "Profile Not Found",
          description: "Your profile was not found. Please contact support.",
          variant: "destructive",
        });
        // Set a minimal profile so the page doesn't show login prompt
        setUserProfile({
          full_name: session.user.email?.split('@')[0] || 'User',
          email: session.user.email || 'No email',
          kite_accesstoken: null,
          groww_accesstoken: null,
          upstox_accesstoken: null
        });
      } else {
        console.log('Settings: Profile loaded successfully:', profileData);
        setUserProfile(profileData);
      }

      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('investor_type, risk_comfort, alert_pref')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Settings: Preferences fetch result:', { preferencesData, preferencesError });

      if (preferencesError) {
        console.error('Error fetching preferences:', preferencesError);
        // Don't fail completely, just show empty preferences
      } else {
        setPreferences(preferencesData);
      }
    } catch (error) {
      console.error('Settings: Error fetching user data:', error);
      // Don't redirect on data fetch errors, just show the error
      toast({
        title: "Warning",
        description: "Some user data could not be loaded",
        variant: "default",
      });
    } finally {
      console.log('Settings: Setting loading to false');
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    navigate('/integration');
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

  // Show login prompt if no user data but don't force logout
  if (!userProfile?.email) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="ArthSetu" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">ArthSetu</span>
          </div>
          
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to Settings</h2>
              <p className="text-muted-foreground mb-4">Please log in to view your profile and preferences</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
        <BottomTabBar />
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
                {userProfile?.groww_accesstoken ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-primary text-sm">Connected</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary h-auto p-1"
                    onClick={() => handleConnect('groww')}
                  >
                    Connect
                  </Button>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Upstox</span>
                {userProfile?.upstox_accesstoken ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-primary text-sm">Connected</span>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary h-auto p-1"
                    onClick={() => handleConnect('upstox')}
                  >
                    Connect
                  </Button>
                )}
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