import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Check, X, User, Building2, Briefcase, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KycChecklistItem, DEFAULT_KYC_CHECKLIST, BusinessType } from '@/types/kyc';

// Mock data for a pending review agent
const mockAgent = {
  id: '1',
  businessName: 'ABC Enterprises',
  contactName: 'John Doe',
  phone: '+234 801 234 5678',
  email: 'john@abc.com',
  kycStatus: 'pending_review',
  kycSubmission: {
    businessType: 'registered_business' as BusinessType,
    fullName: 'John Doe',
    phoneNumber: '+234 801 234 5678',
    email: 'john@abc.com',
    businessName: 'ABC Enterprises',
    cacNumber: 'RC123456',
    governmentIdUrl: undefined as string | undefined,
    passportPhotoUrl: undefined as string | undefined,
    directorIdUrl: 'https://storage.example.com/director-id.pdf',
    businessAddressProofUrl: 'https://storage.example.com/address-proof.pdf',
    companyDocumentsUrl: undefined as string | undefined,
    directorsListUrl: undefined as string | undefined,
    declarationAccepted: true,
    submittedAt: '2024-01-15T10:30:00Z',
  },
  createdAt: '2024-01-15',
};

const BUSINESS_TYPE_ICONS = {
  individual_trader: User,
  registered_business: Building2,
  corporate: Briefcase,
};

const BUSINESS_TYPE_LABELS = {
  individual_trader: 'Individual Trader',
  registered_business: 'Registered Business',
  corporate: 'Corporate',
};

export default function KycReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checklist, setChecklist] = useState<KycChecklistItem[]>(
    DEFAULT_KYC_CHECKLIST.map(item => ({ ...item, checked: false, comment: '' }))
  );
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agent = mockAgent; // In real app, fetch by id
  const Icon = BUSINESS_TYPE_ICONS[agent.kycSubmission.businessType];

  const updateChecklistItem = (itemId: string, updates: Partial<KycChecklistItem>) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const allChecked = checklist.every(item => item.checked);

  const handleApprove = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Agent Approved',
      description: `${agent.businessName} has been approved and can now access their dashboard.`,
    });
    
    navigate('/agents/kyc-review');
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting this application.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Agent Rejected',
      description: `${agent.businessName}'s application has been rejected.`,
    });
    
    setRejectDialogOpen(false);
    navigate('/agents/kyc-review');
    setIsSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="KYC Review"
        description={`Review KYC submission for ${agent.businessName}`}
        actions={
          <Button variant="ghost" onClick={() => navigate('/agents/kyc-review')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel - Agent Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{BUSINESS_TYPE_LABELS[agent.kycSubmission.businessType]}</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(agent.kycSubmission.submittedAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{agent.kycSubmission.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{agent.kycSubmission.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium">{agent.kycSubmission.phoneNumber}</p>
                </div>
                {agent.kycSubmission.businessName && (
                  <div>
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{agent.kycSubmission.businessName}</p>
                  </div>
                )}
                {agent.kycSubmission.cacNumber && (
                  <div>
                    <Label className="text-muted-foreground">CAC Number</Label>
                    <p className="font-medium">{agent.kycSubmission.cacNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agent.kycSubmission.governmentIdUrl && (
                  <DocumentPreview label="Government ID" url={agent.kycSubmission.governmentIdUrl} />
                )}
                {agent.kycSubmission.passportPhotoUrl && (
                  <DocumentPreview label="Passport Photo" url={agent.kycSubmission.passportPhotoUrl} />
                )}
                {agent.kycSubmission.directorIdUrl && (
                  <DocumentPreview label="Director's ID" url={agent.kycSubmission.directorIdUrl} />
                )}
                {agent.kycSubmission.businessAddressProofUrl && (
                  <DocumentPreview label="Business Address Proof" url={agent.kycSubmission.businessAddressProofUrl} />
                )}
                {agent.kycSubmission.companyDocumentsUrl && (
                  <DocumentPreview label="Company Documents" url={agent.kycSubmission.companyDocumentsUrl} />
                )}
                {agent.kycSubmission.directorsListUrl && (
                  <DocumentPreview label="Directors List" url={agent.kycSubmission.directorsListUrl} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Checklist */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Checklist</CardTitle>
              <CardDescription>
                Complete all verification items before approving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) =>
                          updateChecklistItem(item.id, { checked: !!checked })
                        }
                      />
                      <label
                        htmlFor={item.id}
                        className={cn(
                          'text-sm cursor-pointer',
                          item.checked && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.label}
                      </label>
                    </div>
                    <Textarea
                      placeholder="Add a note (optional)"
                      value={item.comment || ''}
                      onChange={(e) =>
                        updateChecklistItem(item.id, { comment: e.target.value })
                      }
                      className="text-xs h-16"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleApprove}
              disabled={!allChecked || isSubmitting}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve Agent
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setRejectDialogOpen(true)}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Reject Agent
            </Button>
          </div>

          {!allChecked && (
            <p className="text-xs text-muted-foreground text-center">
              Complete all checklist items to approve
            </p>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC application. This will be shown to the agent.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentPreview({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">
          <FileText className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Button variant="ghost" size="sm" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
