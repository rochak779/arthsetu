import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Clock, Send, Check, Archive } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";
import logo from "@/assets/logo007.svg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { useAlerts, markAlertRead, archiveAlert } from "@/hooks/useAlerts";

type PublishHoldingsResponse = {
  success: boolean;
  status?: 'queued-or-throttled';
  event_id?: string;
  webhook_url?: string;
  holdings_count?: number;
  total_value?: number;
  error?: string;
};
const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const { alerts, loading } = useAlerts({ includeGlobal: true, status: "all", limit: 20 });
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
      const { data, error } = await supabase.functions.invoke<PublishHoldingsResponse>('publish-holdings-webhook', {
        body: { environment: 'production' }
      });
      
      if (error) throw error;
      if (data && data.status === 'queued-or-throttled') {
        toast({
          title: "Analysis queued",
          description: "We hit a temporary limit. Please try again in about a minute if it doesn't complete.",
        });
      } else {
        toast({
          title: "Analysis started",
          description: "We're analyzing your portfolio based on your latest holdings.",
        });
      }
    } catch (error) {
      console.error('Error syncing to n8n:', error);
      toast({
        title: "Couldn't start analysis",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Derived metrics for summary cards
  const totalAlerts = alerts.length;
  const highPriority = useMemo(() => alerts.filter(a => a.priority === 'high').length, [alerts]);
  const avgConfidence = useMemo(() => {
    if (!alerts.length) return 0;
    const score = (c?: string | null) => c === 'high' ? 100 : c === 'medium' ? 66 : c === 'low' ? 33 : 0;
    const sum = alerts.reduce((acc, a) => acc + score(a.confidence), 0);
    return Math.round(sum / alerts.length);
  }, [alerts]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id);
      toast({ title: "Marked as read" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Failed to mark as read", description: msg, variant: "destructive" });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveAlert(id);
      toast({ title: "Archived" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Failed to archive", description: msg, variant: "destructive" });
    }
  };
  return <div className="min-h-screen bg-background pb-20">
  <div className="w-full max-w-md mx-auto px-6 py-8 space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-3">
            <img src={logo} alt="App logo" className="h-16 w-32 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Alerts</h1>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary">{totalAlerts}</p>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">{highPriority}</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">{avgConfidence}%</p>
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
              {isSyncing ? "Analyzing..." : "Analyze Portfolio"}
            </Button>
          </div>

          {loading && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-sm text-muted-foreground">Loading alerts…</CardContent>
            </Card>
          )}

          {!loading && alerts.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-sm text-muted-foreground">No alerts yet. They’ll show up here when available.</CardContent>
            </Card>
          )}

          {!loading && alerts.map(alert => (
            <Card key={alert.id} className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors" onClick={() => navigate(`/alert/${alert.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{alert.symbol ?? alert.title ?? 'Alert'}</h3>
                      {alert.summary && <p className="text-sm text-muted-foreground">{alert.summary}</p>}
                    </div>
                    {alert.priority === "high" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 text-destructive text-[10px] px-2 py-0.5">HIGH</span>
                    )}
                  </div>
                  <div className={`text-sm font-semibold uppercase ${getStatusColor(alert.action)}`}>
                    {alert.action}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {alert.action !== "hold" && (
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
                        variant={getActionButtonVariant(alert.action)} 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleKiteRedirect();
                        }}
                      >
                        {getButtonText(alert.action)}
                      </Button>
                    </>
                  )}
                  {alert.action === "hold" && (
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

                {/* Secondary actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    disabled={!alert.user_id}
                    onClick={(e) => { e.stopPropagation(); handleMarkRead(alert.id); }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Mark as Read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    disabled={!alert.user_id}
                    onClick={(e) => { e.stopPropagation(); handleArchive(alert.id); }}
                  >
                    <Archive className="h-4 w-4 mr-1" /> Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <BottomTabBar />
    </div>;
};
export default Dashboard;