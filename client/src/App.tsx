import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";

// Import all pages
import Dashboard from "./pages/Dashboard";
import Representatives from "./pages/Representatives";
import Clients from "./pages/Clients";
import Opportunities from "./pages/Opportunities";
import Goals from "./pages/Goals";
import Activities from "./pages/Activities";
import Reports from "./pages/Reports";
import AIInsights from "./pages/AIInsights";
import QuickActivityRegister from "./pages/QuickActivityRegister";
import GeographicMap from "./pages/GeographicMap";
import EmailAlerts from "./pages/EmailAlerts";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationPreferences from "./pages/NotificationPreferences";
import RepresentativeProfile from "./pages/RepresentativeProfile";
import DataImport from "./pages/DataImport";
import DashboardEnhanced from "./pages/DashboardEnhanced";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import AdminPanel from "./pages/AdminPanel";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Demo routes for testing without authentication */}
      <Route path={"/demo"}>
        {() => (
          <DashboardLayout>
            <Home />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/dashboard"}>
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/representatives"}>
        {() => (
          <DashboardLayout>
            <Representatives />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/clients"}>
        {() => (
          <DashboardLayout>
            <Clients />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/opportunities"}>
        {() => (
          <DashboardLayout>
            <Opportunities />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/goals"}>
        {() => (
          <DashboardLayout>
            <Goals />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/activities"}>
        {() => (
          <DashboardLayout>
            <Activities />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/reports"}>
        {() => (
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/ai-insights"}>
        {() => (
          <DashboardLayout>
            <AIInsights />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/geographic-map"}>
        {() => (
          <DashboardLayout>
            <GeographicMap />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/email-alerts"}>
        {() => (
          <DashboardLayout>
            <EmailAlerts />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/notification-center"}>
        {() => (
          <DashboardLayout>
            <NotificationCenter />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/notification-preferences"}>
        {() => (
          <DashboardLayout>
            <NotificationPreferences />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/quick-register"}>
        {() => (
          <DashboardLayout>
            <QuickActivityRegister />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/demo/data-import"}>
        {() => (
          <DashboardLayout>
            <DataImport />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/admin"}>
        {() => <AdminPanel />}
      </Route>
      <Route path={"/demo/admin"}>
        {() => <AdminPanel />}
      </Route>
      <Route path={"/demo/advanced-analytics"}>
        {() => (
          <DashboardLayout>
            <AdvancedAnalytics />
          </DashboardLayout>
        )}
      </Route>
      
      {isAuthenticated && (
        <>
          <Route path={"/dashboard/*"}>
            {() => (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/representatives/*"}>
            {() => (
              <DashboardLayout>
                <Representatives />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/opportunities/*"}>
            {() => (
              <DashboardLayout>
                <Opportunities />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/clients/*"}>
            {() => (
              <DashboardLayout>
                <Clients />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/goals/*"}>
            {() => (
              <DashboardLayout>
                <Goals />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/activities/*"}>
            {() => (
              <DashboardLayout>
                <Activities />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/reports/*"}>
            {() => (
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/ai-insights/*"}>
            {() => (
              <DashboardLayout>
                <AIInsights />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/quick-register/*"}>
            {() => (
              <DashboardLayout>
                <QuickActivityRegister />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/geographic-map/*"}>
            {() => (
              <DashboardLayout>
                <GeographicMap />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/email-alerts/*"}>
            {() => (
              <DashboardLayout>
                <EmailAlerts />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/notification-center/*"}>
            {() => (
              <DashboardLayout>
                <NotificationCenter />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/notification-preferences/*"}>
            {() => (
              <DashboardLayout>
                <NotificationPreferences />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/representative-profile/:id/*"}>
            {() => (
              <DashboardLayout>
                <RepresentativeProfile />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/data-import/*"}>
            {() => (
              <DashboardLayout>
                <DataImport />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/dashboard-enhanced/*"}>
            {() => (
              <DashboardLayout>
                <DashboardEnhanced />
              </DashboardLayout>
            )}
          </Route>
          <Route path={"/advanced-analytics/*"}>
            {() => (
              <DashboardLayout>
                <AdvancedAnalytics />
              </DashboardLayout>
            )}
          </Route>
        </>
      )}
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
