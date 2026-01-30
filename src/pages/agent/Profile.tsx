import { useState } from 'react';
import { User, MapPin, Phone, Mail, Building, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/services/ApiService';

export default function Profile() {
  const { user, partner } = useAuth();
  const { toast } = useToast();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const { data: profileResp, isLoading: loadingProfile } = useQuery({
    queryKey: ['agent_profile'],
    queryFn: () => apiService.get('/profile'),
  });

  const profile = profileResp?.data ?? profileResp ?? null;

  const partnerProfile = profile?.partner_profile?.profile ?? profile?.partner_profile ?? null;
  const agentProfile = profile?.agent_profile ?? profile?.agent ?? null;
  const userProfile = profile?.user ?? profile?.user ?? null;
  const context = profile?.context ?? null;

  const profileData = {
    businessName: agentProfile?.business_name ?? partnerProfile?.name ?? partner?.name ?? '—',
    contactName: agentProfile?.contact_name ?? (userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : (user ? `${user.firstName} ${user.lastName}` : 'Agent User')),
    email: agentProfile?.contact_email ?? userProfile?.email ?? user?.email ?? '—',
    phone: agentProfile?.contact_phone ?? userProfile?.phone ?? '—',
    address: agentProfile?.address ?? partnerProfile?.address ?? '—',
    state: agentProfile?.state ?? partnerProfile?.state ?? '—',
    partnerName: partnerProfile?.name ?? partner?.name ?? '—',
    status: agentProfile?.status ?? 'active',
    accountNumber: profile?.settlement_account?.account_number ?? '—',
    bankName: profile?.settlement_account?.bank ?? '—',
    lastLogin: userProfile?.last_login_at ?? null,
    roleLabel: context?.role_label ?? context?.role ?? null,
    permissions: context?.permissions ?? [],
  };

  const handleRequestUpdate = () => {
    toast({ title: 'Request sent', description: 'Your update request has been sent to your partner administrator.' });
    setRequestModalOpen(false);
    setRequestMessage('');
  };

  return (
    <div>
      <PageHeader
        title={loadingProfile ? 'Profile' : `${userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : profileData.contactName}`}
        description={loadingProfile ? 'Your business and contact information.' : `${profileData.roleLabel ?? 'Agent'} • ${profileData.partnerName}`}
        // actions={<Button variant="outline" onClick={() => setRequestModalOpen(true)}><MessageSquare className="mr-2 h-4 w-4" />Request Update</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Business Information</CardTitle><CardDescription>Your registered business details.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Business Name</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.businessName}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Address</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.address}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">State</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.state}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Status</span><StatusBadge status={(loadingProfile ? 'active' : (profileData.status as any)) ?? 'active'} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Contact Information</CardTitle><CardDescription>Your personal contact details.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Contact Name</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.contactName}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center gap-1"><Mail className="h-4 w-4" />Email</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.email}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" />Phone</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.phone}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Partner Information</CardTitle><CardDescription>Your assigned partner details.</CardDescription></CardHeader>
          <CardContent><div className="flex justify-between py-2"><span className="text-muted-foreground">Partner Name</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.partnerName}</span></div></CardContent>
        </Card>
        {/* <Card>
          <CardHeader><CardTitle>Bank Account</CardTitle><CardDescription>Your settlement account (read-only).</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Bank</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.bankName}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Account</span><span className="font-medium">{loadingProfile ? 'Loading…' : profileData.accountNumber}</span></div>
          </CardContent>
        </Card> */}
      </div>
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Profile Update</DialogTitle><DialogDescription>Describe what information you'd like to update. Your partner administrator will review and process your request.</DialogDescription></DialogHeader>
          <Textarea placeholder="Describe the changes you need..." value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows={4} />
          <DialogFooter><Button variant="outline" onClick={() => setRequestModalOpen(false)}>Cancel</Button><Button onClick={handleRequestUpdate} disabled={!requestMessage.trim()}>Send Request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
