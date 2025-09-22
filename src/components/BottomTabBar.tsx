import { BarChart3, TrendingUp, Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: "alerts", label: "Alerts", icon: Bell, path: "/dashboard" },
    { id: "portfolio", label: "Portfolio", icon: BarChart3, path: "/portfolio" },
    { id: "market", label: "Market", icon: TrendingUp, path: "/market" }
  ];

  const getTabClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
      isActive ? "text-primary" : "text-secondary"
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={getTabClasses(tab.path)}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;