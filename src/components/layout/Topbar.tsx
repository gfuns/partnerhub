import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout, branding, getAssetUrl } = useAuth();

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const avatarUrl = getAssetUrl(user?.avatarUrl);

  return (
    <header 
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b px-4 lg:px-6"
      style={{
        backgroundColor: branding.header_bg_color,
        borderBottomColor: branding.border_color,
        color: branding.header_text_color,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        style={{ color: branding.header_text_color }}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="flex-1">
        <form className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: branding.text_muted_color }} />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full max-w-sm pl-8 border-0"
              style={{ 
                backgroundColor: branding.body_bg_color,
                color: branding.text_primary_color,
              }}
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        {/* <Button variant="ghost" size="icon" className="relative" style={{ color: branding.header_text_color }}>
          <Bell className="h-5 w-5" />
          <span 
            className="absolute right-2 top-2 h-2 w-2 rounded-full" 
            style={{ backgroundColor: branding.danger_color }}
          />
          <span className="sr-only">Notifications</span>
        </Button> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.firstName || 'User'} />}
                <AvatarFallback 
                  className="text-sm"
                  style={{ 
                    backgroundColor: branding.primary_color,
                    color: branding.btn_primary_text_color,
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={logout} 
              className="cursor-pointer"
              style={{ color: branding.danger_color }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
