import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Clock, Star, Send } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";
import logo from "@/assets/logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const mockAlerts = [{
    id: 1,
    stock: "MAZDOCK",
    summary: "Strong buy signal",
    status: "buy",
    priority: "high"
  }, {
    id: 2,
    stock: "SBIN",
    summary: "Consider trimming",
    status: "trim",
    priority: "high"
  }, {
    id: 3,
    stock: "RELIANCE",
    summary: "Hold position",
    status: "hold",
    priority: "high"
  }, {
    id: 4,
    stock: "ITC",
    summary: "Monitor closely",
    status: "buy",
    priority: "medium"
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case "buy":
        return "text-status-buy";
      case "trim":
        return "text-status-trim";
      case "hold":
        return "text-status-hold";
      default:
        return "text-muted-foreground";
    }
  };
  const getActionButtonVariant = (status: string) => {
    return status === "buy" ? "default" : "outline";
  };

  const getButtonText = (status: string) => {
    return status === "buy" ? "Buy Now" : "Trim";
  };

  const handleKiteRedirect = () => {
    window.open('https://kite.zerodha.com/', '_blank');
  };

  const handleSyncToN8n = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('publish-holdings-webhook', {
        body: { environment: 'test' }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Holdings data synced to n8n successfully",
      });
    } catch (error) {
      console.error('Error syncing to n8n:', error);
      toast({
        title: "Error",
        description: "Failed to sync holdings to n8n",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  return <div className="min-h-screen bg-background pb-20">
      <div className="w-full max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ArthSetu Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">ArthSetu</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Alerts</h1>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">4</p>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">3</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">78%</p>
              <p className="text-xs text-muted-foreground">Average Confidence</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Alert Tiles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncToN8n}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSyncing ? "Syncing..." : "Sync to n8n"}
            </Button>
          </div>
          
          {mockAlerts.map(alert => <Card key={alert.id} className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors" onClick={() => navigate(`/alert/${alert.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{alert.stock}</h3>
                      <p className="text-sm text-muted-foreground">{alert.summary}</p>
                    </div>
                    {alert.priority === "high"}
                  </div>
                  <div className={`text-sm font-semibold uppercase ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {alert.status !== "hold" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-transparent border-accent text-accent hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/alert/${alert.id}`);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant={getActionButtonVariant(alert.status)} 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKiteRedirect();
                        }}
                      >
                        {getButtonText(alert.status)}
                      </Button>
                    </>
                  )}
                  {alert.status === "hold" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-transparent border-accent text-accent hover:bg-accent/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/alert/${alert.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>
      
      <BottomTabBar />
    </div>;
};
export default Dashboard;