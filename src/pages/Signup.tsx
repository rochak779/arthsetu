import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        // Insert user data into our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: data.user.id,
            full_name: formData.fullName,
            email: formData.email
          });

        if (insertError) {
          console.error('Error inserting user data:', insertError);
        }

        navigate("/verify-email");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Progress indicator */}
        <div className="text-center">
          <p className="text-muted-foreground">Step 1 of 3</p>
        </div>
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">Join thousands of smart investors</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="h-14 text-lg bg-card border-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-14 text-lg bg-card border-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-14 text-lg bg-card border-border"
              required
            />
          </div>
          
          {/* Buttons */}
          <div className="space-y-4 pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Sign Up Free"}
            </Button>
            
            <Link to="/login" className="block">
              <Button type="button" variant="outline" className="w-full h-14 text-lg font-semibold bg-transparent border-accent text-accent hover:bg-accent/10">
                Login
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;