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
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

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
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }, // No permission required for dashboard
  { label: 'Agents', href: '/agents', icon: Users, permission: 'agents.view' },
  { label: 'KYC Review', href: '/kyc-review/agents', icon: FileCheck, permission: 'agents.view' },
  { label: 'Terminals', href: '/terminals', icon: CreditCard, permission: 'terminals.view' },
  { label: 'Transactions', href: '/transactions', icon: Receipt, permission: 'transactions.view' },
  { label: 'Wallet', href: '/wallet', icon: Wallet, permission: 'wallet.view' },
  { label: 'Commissions', href: '/commissions', icon: Coins, permission: 'commissions.view' },
  { label: 'Settlements', href: '/settlements', icon: Wallet, permission: 'settlements.view' },
  { label: 'Reports', href: '/reports', icon: FileText, permission: 'reports.view' },
  // { label: 'Support', href: '/support', icon: FileText },
  { label: 'Monitoring', href: '/monitoring', icon: Activity, permission: 'monitoring.view' },
  { label: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
];

const agentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }, // No permission required for dashboard
  { label: 'My Terminals', href: '/my-terminals', icon: CreditCard, permission: 'terminals.view' },
  { label: 'Transactions', href: '/agent/transactions', icon: Receipt, permission: 'transactions.view' },
  { label: 'Support', href: '/support', icon: FileText },
  // { label: 'Settlements', href: '/settlements', icon: Wallet, permission: 'settlements.view' },
  // { label: 'Commissions', href: '/commissions', icon: Coins, permission: 'commissions.view' },
  { label: 'Profile', href: '/profile', icon: UserCircle }, // No permission required
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout, hasPermission, branding, getAssetUrl } = useAuth();
  const location = useLocation();

  // Determine if user is an agent based on role
  const isAgent = user?.role?.startsWith('agent');
  
  const navItems = isAgent ? agentNavItems : partnerNavItems;
  
  // If user has no permissions array or empty permissions, show all items
  // Otherwise filter based on permissions
  const filteredNavItems = user?.permissions && user.permissions.length > 0
    ? navItems.filter((item) => !item.permission || hasPermission(item.permission))
    : navItems; // Show all items if no permissions defined

  // Get branding-based styles
  const sidebarStyle = {
    backgroundColor: branding.sidebar_bg_color,
  };

  const logoUrl = getAssetUrl(branding.logo_url);

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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={sidebarStyle}
      >
        {/* Header */}
        <div 
          className="flex h-16 items-center justify-between px-4"
          style={{ 
            borderBottomColor: branding.sidebar_bg_color,
            borderBottomWidth: '1px',
            backgroundColor: branding.sidebar_logo_bg_color || branding.sidebar_bg_color
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl} 
              alt="Logo" 
              className="h-10 max-w-[180px] object-contain"
            />
          ) : (
            <Logo variant="light" size="lg" />
          )}
          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ color: branding.sidebar_text_color }}
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              // Active if current path starts with menu href (and href is not "/")
              const isActive = item.href !== '/' && location.pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? branding.sidebar_active_bg_color : 'transparent',
                      color: isActive ? branding.sidebar_active_text_color : branding.sidebar_text_color,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = branding.sidebar_hover_bg_color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
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
        <div 
          className="p-4"
          style={{ 
            borderTopColor: branding.sidebar_bg_color,
            borderTopWidth: '1px'
          }}
        >
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{ color: branding.sidebar_text_color }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = branding.sidebar_hover_bg_color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
