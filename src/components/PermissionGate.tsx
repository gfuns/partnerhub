import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface PermissionGateProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false 
}: PermissionGateProps) {
  const { hasPermission } = useAuth();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p))
    : permissions.some(p => hasPermission(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
