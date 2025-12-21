import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AgentsList from "./pages/agents/AgentsList";
import TerminalsList from "./pages/terminals/TerminalsList";
import TransactionsList from "./pages/transactions/TransactionsList";
import ReportsList from "./pages/reports/ReportsList";
import MonitoringDashboard from "./pages/monitoring/MonitoringDashboard";
import UsersList from "./pages/users/UsersList";
import SettingsPage from "./pages/settings/SettingsPage";

// Agent pages
import MyTerminals from "./pages/agent/MyTerminals";
import Settlements from "./pages/agent/Settlements";
import Commissions from "./pages/agent/Commissions";
import Profile from "./pages/agent/Profile";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Partner routes */}
              <Route path="/agents" element={<AgentsList />} />
              <Route path="/terminals" element={<TerminalsList />} />
              <Route path="/transactions" element={<TransactionsList />} />
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/monitoring" element={<MonitoringDashboard />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* Agent routes */}
              <Route path="/my-terminals" element={<MyTerminals />} />
              <Route path="/settlements" element={<Settlements />} />
              <Route path="/commissions" element={<Commissions />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
