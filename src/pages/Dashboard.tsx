import { useAuth } from '@/contexts/AuthContext';
import PartnerDashboard from './dashboard/PartnerDashboard';
import AgentDashboard from './dashboard/AgentDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'agent') {
    return <AgentDashboard />;
  }

  return <PartnerDashboard />;
}
