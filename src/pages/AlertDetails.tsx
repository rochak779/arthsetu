import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertRecord, markAlertRead, archiveAlert } from "@/hooks/useAlerts";
import { useToast } from "@/hooks/use-toast";

const AlertDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [record, setRecord] = useState<AlertRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (mounted) setRecord((data as AlertRecord) ?? null);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load alert");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const getButtonText = (status: string) => {
    return status === "buy" ? "Buy Now" : "Trim";
  };

  const handleKiteRedirect = () => {
    window.open('https://kite.zerodha.com/', '_blank');
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-primary";
      case "medium": return "text-warning";
      case "low": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    const iconClass = "h-5 w-5";
    switch (confidence) {
      case "high": return <TrendingUp className={`${iconClass} text-primary`} />;
      case "medium": return <TrendingUp className={`${iconClass} text-warning`} />;
      case "low": return <TrendingUp className={`${iconClass} text-destructive`} />;
      default: return <TrendingUp className={`${iconClass} text-muted-foreground`} />;
    }
  };

  const priceText = useMemo(() => record?.last_price != null ? `₹${record.last_price}` : "—", [record]);
  const changeText = useMemo(() => record?.change_pct != null ? `${record.change_pct > 0 ? "+" : ""}${record.change_pct}%` : "—", [record]);

  const onMarkRead = async () => {
    if (!record) return;
    try {
      await markAlertRead(record.id);
      toast({ title: "Marked as read" });
      setRecord({ ...record, lifecycle_status: "read", read_at: new Date().toISOString() });
    } catch (e: any) {
      toast({ title: "Failed to mark as read", description: e?.message ?? String(e), variant: "destructive" });
    }
  };

  const onArchive = async () => {
    if (!record) return;
    try {
      await archiveAlert(record.id);
      toast({ title: "Archived" });
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Failed to archive", description: e?.message ?? String(e), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-foreground hover:bg-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{record?.symbol ?? record?.title ?? "Alert"}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Info */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{record?.symbol ?? record?.title ?? "Alert"}</h2>
                  <p className="text-lg text-muted-foreground">{priceText}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-primary">{changeText}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Alert Summary</h3>
            <p className="text-foreground leading-relaxed">{record?.full_summary ?? record?.summary ?? ""}</p>
          </div>

          {/* Confidence Level */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getConfidenceIcon(record?.confidence ?? "medium")}
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence Level</p>
                    <p className={`font-semibold capitalize ${getConfidenceColor(record?.confidence ?? "medium")}`}>
                      {record?.confidence ?? "medium"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          {record?.payload?.sources?.length ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Sources</h3>
              <div className="space-y-2">
                {record.payload.sources.map((source: any, index: number) => (
                  <Card key={index} className="bg-card border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <a href={source.url ?? '#'} target="_blank" rel="noreferrer" className="text-accent font-medium underline">
                          {source.title ?? source.url}
                        </a>
                        <ExternalLink className="h-4 w-4 text-accent" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {record?.action !== "hold" && (
              <Button 
                className="w-full h-14 text-lg font-semibold"
                onClick={handleKiteRedirect}
              >
                {getButtonText(record?.action ?? "hold")}
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full h-14 text-lg font-semibold bg-transparent border-muted text-muted-foreground hover:bg-muted/10"
              onClick={onMarkRead}
            >
              Mark as Read
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 text-lg font-semibold bg-transparent border-muted text-muted-foreground hover:bg-muted/10"
              onClick={onArchive}
            >
              Archive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetails;