import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";

const AlertDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app this would come from API
  const alertData = {
    stock: "MAZDOCK",
    fullSummary: "Mazagon Dock Shipbuilders Ltd. is showing strong bullish momentum with a breakthrough above key resistance levels. Technical indicators suggest continued upward movement with strong volume support. The company's recent earnings beat and positive guidance for the next quarter provide fundamental backing for this technical signal.",
    confidence: "high", // high, medium, low
    sources: [
      { title: "Mazdock Earnings Beat Estimates", url: "#" },
      { title: "Technical Analysis: MAZDOCK Breakout", url: "#" },
      { title: "Market News: Tech Sector Rally", url: "#" }
    ],
    status: "buy",
    price: "₹2980.50",
    change: "+2.4%"
  };

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
          <h1 className="text-xl font-bold text-foreground">{alertData.stock}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Info */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{alertData.stock}</h2>
                  <p className="text-lg text-muted-foreground">{alertData.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-primary">{alertData.change}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Alert Summary</h3>
            <p className="text-foreground leading-relaxed">{alertData.fullSummary}</p>
          </div>

          {/* Confidence Level */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getConfidenceIcon(alertData.confidence)}
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence Level</p>
                    <p className={`font-semibold capitalize ${getConfidenceColor(alertData.confidence)}`}>
                      {alertData.confidence}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Sources</h3>
            <div className="space-y-2">
              {alertData.sources.map((source, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-accent font-medium">{source.title}</p>
                      <ExternalLink className="h-4 w-4 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {alertData.status !== "hold" && (
              <Button 
                className="w-full h-14 text-lg font-semibold"
                onClick={handleKiteRedirect}
              >
                {getButtonText(alertData.status)}
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full h-14 text-lg font-semibold bg-transparent border-muted text-muted-foreground hover:bg-muted/10"
            >
              Mark as Read
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDetails;