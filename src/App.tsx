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

// Partner pages - Agents
import AgentsList from "./pages/agents/AgentsList";
import AddAgent from "./pages/agents/AddAgent";
import EditAgent from "./pages/agents/EditAgent";
import AgentDetails from "./pages/agents/AgentDetails";

// Partner pages - Terminals
import TerminalsList from "./pages/terminals/TerminalsList";
import IssuePOS from "./pages/terminals/IssuePOS";
import TerminalDetails from "./pages/terminals/TerminalDetails";

// Partner pages - Transactions
import TransactionsList from "./pages/transactions/TransactionsList";
import TransactionDetails from "./pages/transactions/TransactionDetails";

// Partner pages - Users
import UsersList from "./pages/users/UsersList";
import CreateUser from "./pages/users/CreateUser";
import UserDetails from "./pages/users/UserDetails";

// Partner pages - Other
import ReportsList from "./pages/reports/ReportsList";
import MonitoringDashboard from "./pages/monitoring/MonitoringDashboard";
import SettingsPage from "./pages/settings/SettingsPage";

// Agent pages
import MyTerminals from "./pages/agent/MyTerminals";
import AgentTerminalDetails from "./pages/agent/TerminalDetails";
import AgentTransactions from "./pages/agent/Transactions";
import AgentTransactionDetails from "./pages/agent/TransactionDetails";
import Settlements from "./pages/agent/Settlements";
import SettlementDetails from "./pages/agent/SettlementDetails";
import Commissions from "./pages/agent/Commissions";
import CommissionDetails from "./pages/agent/CommissionDetails";
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
              
              {/* Partner routes - Agents */}
              <Route path="/agents" element={<AgentsList />} />
              <Route path="/agents/new" element={<AddAgent />} />
              <Route path="/agents/:id" element={<AgentDetails />} />
              <Route path="/agents/:id/edit" element={<EditAgent />} />
              
              {/* Partner routes - Terminals */}
              <Route path="/terminals" element={<TerminalsList />} />
              <Route path="/terminals/new" element={<IssuePOS />} />
              <Route path="/terminals/:id" element={<TerminalDetails />} />
              
              {/* Partner routes - Transactions */}
              <Route path="/transactions" element={<TransactionsList />} />
              <Route path="/transactions/:id" element={<TransactionDetails />} />
              
              {/* Partner routes - Users */}
              <Route path="/users" element={<UsersList />} />
              <Route path="/users/new" element={<CreateUser />} />
              <Route path="/users/:id" element={<UserDetails />} />
              
              {/* Partner routes - Other */}
              <Route path="/reports" element={<ReportsList />} />
              <Route path="/monitoring" element={<MonitoringDashboard />} />
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
