import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Preferences from "./pages/Preferences";
import Integration from "./pages/Integration";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Voice from "./pages/Voice";
import Market from "./pages/Market";
import Settings from "./pages/Settings";
import AlertDetails from "./pages/AlertDetails";
import KiteCallback from "./pages/KiteCallback";
import Education from "./pages/Education";
import EducationCategory from "./pages/EducationCategory";
import EducationLesson from "./pages/EducationLesson";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/integration" element={<Integration />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/market" element={<Market />} />
          <Route path="/education" element={<Education />} />
          <Route path="/education/category/:categoryId" element={<EducationCategory />} />
          <Route path="/education/lesson/:lessonId" element={<EducationLesson />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/alert/:id" element={<AlertDetails />} />
          <Route path="/oauth/kite/callback" element={<KiteCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
