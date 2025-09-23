import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Integration = () => {
  const navigate = useNavigate();

  const handleConnect = (platform: string) => {
    // TODO: Handle connection logic
    console.log(`Connecting to ${platform}`);
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Progress indicator */}
        <div className="text-center">
          <p className="text-muted-foreground">Step 4 of 4</p>
        </div>
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Connect Your Trading Account
          </h1>
          <p className="text-muted-foreground">
            Choose your preferred trading platform
          </p>
        </div>
        
        {/* Integration Options */}
        <div className="space-y-4">
          {/* Kite */}
          <Card className="bg-card border-border relative">
            <CardContent className="p-6">
              <div className="absolute top-3 right-3">
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Kite (Zerodha)</h3>
                  <p className="text-muted-foreground text-sm">India's largest broker</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">K</span>
                </div>
              </div>
              <Button 
                onClick={() => handleConnect('Kite')}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Connect to Kite
              </Button>
            </CardContent>
          </Card>

          {/* Groww */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Groww</h3>
                  <p className="text-muted-foreground text-sm">Simple & trusted</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">G</span>
                </div>
              </div>
              <Button 
                onClick={() => handleConnect('Groww')}
                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
              >
                Connect to Groww
              </Button>
            </CardContent>
          </Card>

          {/* Upstox */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Upstox</h3>
                  <p className="text-muted-foreground text-sm">Advanced tools</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">U</span>
                </div>
              </div>
              <Button 
                onClick={() => handleConnect('Upstox')}
                className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
              >
                Connect to Upstox
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Skip Button */}
        <div className="pt-6 text-center">
          <Button 
            onClick={handleSkip}
            variant="ghost"
            className="text-accent hover:text-accent/90 hover:bg-transparent"
          >
            Skip, proceed with sample data
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Integration;