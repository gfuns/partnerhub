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

export default function Profile() {
  const { user, partner } = useAuth();
  const { toast } = useToast();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const profileData = {
    businessName: 'Brown Enterprises',
    contactName: user?.name || 'Agent User',
    email: user?.email || 'agent@demo.com',
    phone: '+234 801 234 5678',
    address: '123 Commerce Street, Lagos',
    state: 'Lagos',
    partnerName: partner?.name || 'Page Financials',
    status: 'active',
    accountNumber: '****5678',
    bankName: 'First Bank',
  };

  const handleRequestUpdate = () => {
    toast({ title: 'Request sent', description: 'Your update request has been sent to your partner administrator.' });
    setRequestModalOpen(false);
    setRequestMessage('');
  };

  return (
    <div>
      <PageHeader title="Profile" description="Your business and contact information." action={<Button variant="outline" onClick={() => setRequestModalOpen(true)}><MessageSquare className="mr-2 h-4 w-4" />Request Update</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Business Information</CardTitle><CardDescription>Your registered business details.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Business Name</span><span className="font-medium">{profileData.businessName}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Address</span><span className="font-medium">{profileData.address}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">State</span><span className="font-medium">{profileData.state}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Status</span><StatusBadge status={profileData.status as 'active'} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Contact Information</CardTitle><CardDescription>Your personal contact details.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Contact Name</span><span className="font-medium">{profileData.contactName}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground flex items-center gap-1"><Mail className="h-4 w-4" />Email</span><span className="font-medium">{profileData.email}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4" />Phone</span><span className="font-medium">{profileData.phone}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Partner Information</CardTitle><CardDescription>Your assigned partner details.</CardDescription></CardHeader>
          <CardContent><div className="flex justify-between py-2"><span className="text-muted-foreground">Partner Name</span><span className="font-medium">{profileData.partnerName}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bank Account</CardTitle><CardDescription>Your settlement account (read-only).</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Bank</span><span className="font-medium">{profileData.bankName}</span></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Account</span><span className="font-medium">{profileData.accountNumber}</span></div>
          </CardContent>
        </Card>
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
