import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import logo from "@/assets/logo007.svg";

const AlertsHistory = () => {
  const navigate = useNavigate();
  const { alerts, loading } = useAlerts({
    includeGlobal: true,
    status: "all",
    limit: 100
  });

  // Filter only read alerts
  const readAlerts = alerts.filter(alert => alert.lifecycle_status === 'read');

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="w-full max-w-md mx-auto px-6 py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logo} alt="App logo" className="h-12 w-24 object-contain" />
          <h1 className="text-xl font-bold text-foreground">Alerts History</h1>
        </div>

        {/* Read Alerts List */}
        <div className="space-y-3">
          {loading && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-sm text-muted-foreground">
                Loading alerts history…
              </CardContent>
            </Card>
          )}

          {!loading && readAlerts.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No read alerts yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Alerts you mark as read will appear here
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && readAlerts.map(alert => (
            <Card 
              key={alert.id} 
              className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors"
              onClick={() => navigate(`/alert/${alert.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {alert.symbol ?? alert.title ?? 'Alert'}
                      </h3>
                      {alert.summary && (
                        <p className="text-sm text-muted-foreground">{alert.summary}</p>
                      )}
                    </div>
                    {alert.priority === "high" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 text-destructive text-[10px] px-2 py-0.5">
                        HIGH
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-semibold uppercase ${getStatusColor(alert.action)}`}>
                    {alert.action}
                  </div>
                </div>

                {alert.read_at && (
                  <p className="text-xs text-muted-foreground">
                    Read on {new Date(alert.read_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsHistory;
