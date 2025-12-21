import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  FileText,
  Activity,
  Settings,
  LogOut,
  Wallet,
  Coins,
  UserCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

const partnerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'Agents', href: '/agents', icon: Users, permission: 'agents.view' },
  { label: 'Terminals', href: '/terminals', icon: CreditCard, permission: 'terminals.view' },
  { label: 'Transactions', href: '/transactions', icon: Receipt, permission: 'transactions.view' },
  { label: 'Reports', href: '/reports', icon: FileText, permission: 'reports.view' },
  { label: 'Monitoring', href: '/monitoring', icon: Activity, permission: 'monitoring.view' },
  { label: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
];

const agentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'My Terminals', href: '/my-terminals', icon: CreditCard, permission: 'my-terminals.view' },
  { label: 'Transactions', href: '/agent/transactions', icon: Receipt, permission: 'transactions.view' },
  { label: 'Settlements', href: '/settlements', icon: Wallet, permission: 'settlements.view' },
  { label: 'Commissions', href: '/commissions', icon: Coins, permission: 'commissions.view' },
  { label: 'Profile', href: '/profile', icon: UserCircle, permission: 'profile.view' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const navItems = user?.role === 'agent' ? agentNavItems : partnerNavItems;
  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Logo variant="light" />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
