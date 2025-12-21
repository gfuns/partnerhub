import { useState } from 'react';
import { Upload, Save, Key, Globe, Shield } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { partner } = useAuth();
  const { toast } = useToast();
  const [partnerName, setPartnerName] = useState(partner?.name || '');
  const [brandColor, setBrandColor] = useState('#4A7DFC');

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your partner profile and platform settings."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Partner Profile</CardTitle>
              <CardDescription>
                Update your partner organization details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partnerName">Organization Name</Label>
                  <Input
                    id="partnerName"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partnerId">Partner ID</Label>
                  <Input
                    id="partnerId"
                    value={partner?.id || 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <PermissionGate permission="settings.edit">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize the appearance of your partner dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Partner Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                    {partner?.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt="Partner logo"
                        className="h-full w-full object-contain rounded-lg"
                      />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <PermissionGate permission="settings.edit">
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                  </PermissionGate>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended size: 200x200px. Max file size: 2MB.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Accent Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="brandColor"
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-20 p-1 cursor-pointer"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="max-w-32"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This color will be used for subtle accents in the UI.
                </p>
              </div>

              <PermissionGate permission="settings.edit">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                View your API credentials and webhook configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value="sk_live_••••••••••••••••••••••••"
                    disabled
                    className="font-mono bg-muted"
                  />
                  <Button variant="outline" size="sm">
                    Reveal
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value="https://api.partner.com/webhooks/xtrapay"
                  disabled
                  className="font-mono bg-muted"
                />
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">API Documentation</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      For detailed API documentation and integration guides, contact your Xtrapay account manager.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security preferences for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically log out after 30 minutes of inactivity.
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Login History</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View recent login activity for your account.
                  </p>
                </div>
                <Button variant="outline">View History</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
