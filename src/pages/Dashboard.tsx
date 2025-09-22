import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Clock } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";

const Dashboard = () => {
  const navigate = useNavigate();

  const mockAlerts = [
    {
      id: 1,
      stock: "AAPL",
      summary: "Strong buy signal",
      status: "buy",
      priority: "high"
    },
    {
      id: 2,
      stock: "GOOGL",
      summary: "Consider trimming",
      status: "trim",
      priority: "medium"
    },
    {
      id: 3,
      stock: "TSLA",
      summary: "Hold position",
      status: "hold",
      priority: "low"
    },
    {
      id: 4,
      stock: "MSFT",
      summary: "Accumulate more",
      status: "buy",
      priority: "high"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "buy": return "text-status-buy";
      case "trim": return "text-status-trim";
      case "hold": return "text-status-hold";
      default: return "text-muted-foreground";
    }
  };

  const getActionButtonVariant = (status: string) => {
    return status === "buy" ? "default" : "outline";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="w-full max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Your portfolio alerts</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">4</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">3</p>
              <p className="text-xs text-muted-foreground">Action Needed</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Alert Tiles */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
          
          {mockAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors"
              onClick={() => navigate(`/alert/${alert.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{alert.stock}</h3>
                    <p className="text-sm text-muted-foreground">{alert.summary}</p>
                  </div>
                  <div className={`text-sm font-semibold uppercase ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 bg-transparent border-accent text-accent hover:bg-accent/10"
                  >
                    View Details
                  </Button>
                  <Button 
                    variant={getActionButtonVariant(alert.status)}
                    size="sm"
                    className="flex-1"
                  >
                    {alert.status === "buy" ? "Buy Now" : alert.status === "trim" ? "Trim" : "Hold"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <BottomTabBar />
    </div>
  );
};

export default Dashboard;