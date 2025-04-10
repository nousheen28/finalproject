import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/layout/theme-provider";
import { AppProvider } from "./lib/context";
import "./index.css";

// Pages
import Index from "./pages";
import LoginForm from "./pages/login";
import SignupForm from "./pages/signup";
import Logout from "./pages/logout";
import SearchPage from "./pages/search";
import NearbyPage from "./pages/nearby";
import NavigationPage from "./pages/navigation";
import PlaceDetailsPage from "./pages/place-details";
import ProfilePage from "./pages/profile";
import MorePage from "./pages/more";
import AddPlacePage from "./pages/add-place";
import ReportProblemPage from "./pages/report-problem";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<Index />} />
              <Route path='/login' element={<LoginForm />} />
              <Route path='/signup' element={<SignupForm />} />
              <Route path='/logout' element={<Logout />} />
              <Route path='/search' element={<SearchPage />} />
              <Route path='/nearby' element={<NearbyPage />} />
              <Route path='/navigation' element={<NavigationPage />} />
              <Route path='/place-details/:id' element={<PlaceDetailsPage />} />
              <Route path='/profile' element={<ProfilePage />} />
              <Route path='/more' element={<MorePage />} />
              <Route path='/add-place' element={<AddPlacePage />} />
              <Route path='/report-problem' element={<ReportProblemPage />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
        <Sonner />
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);