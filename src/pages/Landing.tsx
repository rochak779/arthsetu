import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo1.svg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={logo} alt="ArthSetu Logo" className="h-16 w-16" />
        </div>
        
        {/* Tagline */}
        <h1 className="text-3xl font-bold text-foreground">
          Stay ahead of market moves.
        </h1>
        
        {/* Description */}
        <p className="text-lg text-muted-foreground">
          Get real-time personalised alerts based on your portfolio
        </p>
        
        {/* Buttons */}
        <div className="space-y-4 pt-8">
          <Link to="/signup" className="block">
            <Button className="w-full h-14 text-lg font-semibold">
              Sign Up Free
            </Button>
          </Link>
          
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full h-14 text-lg font-semibold bg-transparent border-accent text-accent hover:bg-accent/10">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;