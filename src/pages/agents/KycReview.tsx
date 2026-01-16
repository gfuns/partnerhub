import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, Building2, Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { kycService } from '@/services/api/kyc.service';
import { DocumentReviewCard } from '@/components/DocumentReviewCard';
import { 
  KycProfileDetails, 
  KYC_REVIEW_STATUS_CONFIG,
  DocumentChecklistItem,
  BusinessType,
  DocumentType,
} from '@/types/kyc';

// Extended checklist item for review flow
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  is_required: boolean;
  checked: boolean;
  comment?: string;
}

const BUSINESS_TYPE_ICONS = {
  individual: User,
  sme: Building2,
  corporate: Briefcase,
};

const BUSINESS_TYPE_LABELS = {
  individual: 'Individual',
  sme: 'SME',
  corporate: 'Corporate',
};

export default function KycReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [kycDetails, setKycDetails] = useState<KycProfileDetails | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistNotes, setChecklistNotes] = useState('');
  
  // Decision modals
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [correctionsDialogOpen, setCorrectionsDialogOpen] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [correctionsComment, setCorrectionsComment] = useState('');
  const [selectedDocsForCorrection, setSelectedDocsForCorrection] = useState<number[]>([]);
  const [documentComments, setDocumentComments] = useState<Record<number, string>>({});
  const [selectedProfileFields, setSelectedProfileFields] = useState<string[]>([]);
  const [profileFieldComments, setProfileFieldComments] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchKycDetails();
    }
  }, [id]);

  const fetchKycDetails = async () => {
    try {
      setIsLoading(true);
      const response = await kycService.getKYCDetails(id!);
      setKycDetails(response.data.kyc_profile);
      
      // Initialize checklist from template
      if (response.data.checklist) {
        setChecklistItems(
          response.data.checklist.items.map(item => ({
            id: item.id.toString(),
            label: item.label,
            description: item.description || '',
            is_required: item.is_required || false,
            checked: false,
          }))
        );
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load KYC details',
        variant: 'destructive',
      });
      navigate('/agents/kyc-review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      await kycService.startReview(id!);
      toast({
        title: 'Review Started',
        description: 'KYC review has been started.',
      });
      fetchKycDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start review',
        variant: 'destructive',
      });
    }
  };

  const handleOpenApproveModal = () => {
    // Validate all documents are approved or verified before opening modal
    const allDocsApproved = kycDetails?.documents.every(doc => 
      doc.status === 'approved' || doc.status === 'verified'
    );
    if (!allDocsApproved) {
      toast({
        title: 'Cannot Approve',
        description: 'All documents must be approved/verified before final approval.',
        variant: 'destructive',
      });
      return;
    }

    setApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    // Validate required checklist items
    const allRequiredComplete = checklistItems
      .filter(item => item.is_required)
      .every(item => item.checked);
    if (!allRequiredComplete) {
      toast({
        title: 'Cannot Approve',
        description: 'All required checklist items must be completed before approval.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format checklist data for backend
      const checklistData = checklistItems.map(item => ({
        item_id: parseInt(item.id),
        checked: item.checked,
        ...(item.comment?.trim() && { comment: item.comment.trim() })
      }));

      await kycService.approve(id!, {
        checklist: checklistData,
        comment: approveComment.trim() || undefined,
      });

      toast({
        title: 'KYC Approved',
        description: 'The KYC application has been approved successfully.',
      });

      setApproveDialogOpen(false);
      navigate('/agents/kyc-review');
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.response?.data?.message || 'Failed to approve KYC',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await kycService.reject(id!, {
        reason: rejectReason.trim(),
      });

      toast({
        title: 'KYC Rejected',
        description: 'The KYC application has been rejected.',
      });

      setRejectDialogOpen(false);
      navigate('/agents/kyc-review');
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.response?.data?.message || 'Failed to reject KYC',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCorrections = async () => {
    // Validate at least one type of correction is provided
    if (selectedDocsForCorrection.length === 0 && selectedProfileFields.length === 0) {
      toast({
        title: 'No Corrections Selected',
        description: 'Please select at least one document or profile field that needs correction.',
        variant: 'destructive',
      });
      return;
    }

    // Build document corrections
    const documentCorrections = selectedDocsForCorrection.map(docId => ({
      document_id: docId,
      comment: documentComments[docId] || 'Please review and correct this document',
    }));

    // Build profile field corrections
    const profileCorrections = selectedProfileFields.map(fieldName => {
      // Get current value from kycDetails
      const currentValue = (kycDetails as any)[fieldName] as string | undefined;
      return {
        field_name: fieldName,
        current_value: currentValue,
        comment: profileFieldComments[fieldName] || 'Please review and correct this field',
      };
    });

    try {
      setIsSubmitting(true);
      await kycService.requestCorrections(id!, {
        document_corrections: documentCorrections.length > 0 ? documentCorrections : undefined,
        profile_corrections: profileCorrections.length > 0 ? profileCorrections : undefined,
        general_comment: correctionsComment.trim() || undefined,
      });

      toast({
        title: 'Corrections Requested',
        description: 'The agent has been notified about required corrections.',
      });

      setCorrectionsDialogOpen(false);
      navigate('/agents/kyc-review');
    } catch (error: any) {
      toast({
        title: 'Request Failed',
        description: error.response?.data?.message || 'Failed to request corrections',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="KYC Review" description="Loading KYC details..." />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!kycDetails) {
    return null;
  }

  const Icon = BUSINESS_TYPE_ICONS[kycDetails.business_type];
  const statusConfig = kycDetails.status 
    ? KYC_REVIEW_STATUS_CONFIG[kycDetails.status] 
    : KYC_REVIEW_STATUS_CONFIG['submitted'];
  const canStartReview = !kycDetails.status || kycDetails.status === 'submitted';
  // Allow decisions when status is under_review OR when any document has been reviewed
  const hasReviewedDocs = kycDetails.documents.some(doc => doc.verified_at !== null);
  const canMakeDecision = kycDetails.status === 'under_review' || hasReviewedDocs;
  const isReadOnly = kycDetails.status === 'approved' || kycDetails.status === 'rejected';

  return (
    <>
      <PageHeader
        title="KYC Review"
        description={`Review KYC submission for ${kycDetails.agent.business_name}`}
        actions={
          <Button variant="ghost" onClick={() => navigate('/agents/kyc-review')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      />

      {/* Agent Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{kycDetails.agent.business_name}</h3>
                <p className="text-sm text-muted-foreground">Agent Code: {kycDetails.agent.code}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {BUSINESS_TYPE_LABELS[kycDetails.business_type]}
                  </Badge>
                  <Badge variant={statusConfig.variant as any}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>

            {canStartReview && (
              <Button onClick={handleStartReview}>
                Start Review
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Contact Person</p>
              <p className="font-medium">{kycDetails.agent.contact_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{kycDetails.agent.contact_email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium">{kycDetails.agent.contact_phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({kycDetails.documents.length})
          </TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist {checklistItems.length > 0 && `(${checklistItems.filter(i => i.checked).length}/${checklistItems.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{kycDetails.agent.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Business Type</Label>
                  <p className="font-medium capitalize">{BUSINESS_TYPE_LABELS[kycDetails.business_type]}</p>
                </div>
                {kycDetails.rc_number && (
                  <div>
                    <Label className="text-muted-foreground">RC Number</Label>
                    <p className="font-medium">{kycDetails.rc_number}</p>
                  </div>
                )}
                {kycDetails.tin_number && (
                  <div>
                    <Label className="text-muted-foreground">TIN</Label>
                    <p className="font-medium">{kycDetails.tin_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{kycDetails.agent.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{kycDetails.agent.contact_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{kycDetails.agent.contact_phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">BVN</Label>
                  <p className="font-medium">{kycDetails.bvn}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Bank Name</Label>
                  <p className="font-medium">{kycDetails.bank_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Number</Label>
                  <p className="font-medium">{kycDetails.account_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Name</Label>
                  <p className="font-medium">{kycDetails.account_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Street Address</Label>
                  <p className="font-medium">{kycDetails.agent.address}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">City</Label>
                  <p className="font-medium">{kycDetails.agent.city}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">State</Label>
                  <p className="font-medium">{kycDetails.agent.state}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">LGA</Label>
                  <p className="font-medium">{kycDetails.agent.lga}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {kycDetails.documents.map((doc) => (
            <DocumentReviewCard
              key={doc.id}
              document={doc}
              profileId={id!}
              onReviewComplete={fetchKycDetails}
              isReadOnly={isReadOnly}
            />
          ))}
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={(checked) => {
                      setChecklistItems(prev =>
                        prev.map(i => i.id === item.id ? { ...i, checked: checked as boolean } : i)
                      );
                    }}
                    disabled={isReadOnly}
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.id} className="font-medium cursor-pointer">
                      {item.label}
                      {item.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))},

              <div className="space-y-2 pt-4">
                <Label htmlFor="checklist-notes">Additional Notes</Label>
                <Textarea
                  id="checklist-notes"
                  placeholder="Add any additional verification notes..."
                  value={checklistNotes}
                  onChange={(e) => setChecklistNotes(e.target.value)}
                  rows={4}
                  disabled={isReadOnly}
                />
              </div>

              {!isReadOnly && (
                <div className="pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    {checklistItems.filter(i => i.is_required && i.checked).length === checklistItems.filter(i => i.is_required).length ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">All required items verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-muted-foreground">
                          {checklistItems.filter(i => i.checked).length} of {checklistItems.length} items completed
                          ({checklistItems.filter(i => i.is_required).length} required)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kycDetails.reviews && kycDetails.reviews.length > 0 ? (
                  kycDetails.reviews.map((entry: any, index: number) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <p className="font-medium">{entry.action}</p>
                        <p className="text-sm text-muted-foreground">{entry.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.created_at).toLocaleString()} - {entry.reviewer_name}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No review history yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision Bar */}
      {canMakeDecision && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Make a final decision on this KYC application
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCorrectionsDialogOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Request Corrections
              </Button>
              <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={handleOpenApproveModal}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Dialog with Checklist */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve KYC Application</DialogTitle>
            <DialogDescription>
              Please review and complete the verification checklist before approving this application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Checklist Items */}
            <div className="space-y-4">
              <div className="font-medium text-sm">Verification Checklist</div>
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id={`approve-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(checked) => {
                      setChecklistItems(prev =>
                        prev.map(i => i.id === item.id ? { ...i, checked: checked as boolean } : i)
                      );
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`approve-${item.id}`} className="font-medium cursor-pointer">
                      {item.label}
                      {item.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Checklist Progress */}
              <div className="flex items-center gap-2 text-sm pt-2">
                {checklistItems.filter(i => i.is_required && i.checked).length === checklistItems.filter(i => i.is_required).length ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">All required items verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">
                      {checklistItems.filter(i => i.is_required && i.checked).length} of {checklistItems.filter(i => i.is_required).length} required items completed
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Approval Comment */}
            <div className="space-y-2">
              <Label htmlFor="approve-comment">Approval Comment (Optional)</Label>
              <Textarea
                id="approve-comment"
                placeholder="Add any approval notes..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isSubmitting || !checklistItems.filter(i => i.is_required).every(i => i.checked)}
            >
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this application is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Corrections Dialog */}
      <Dialog open={correctionsDialogOpen} onOpenChange={setCorrectionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Corrections</DialogTitle>
            <DialogDescription>
              Select documents and/or profile fields that need correction and provide specific feedback.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents">
                Documents ({selectedDocsForCorrection.length})
              </TabsTrigger>
              <TabsTrigger value="profile">
                Profile Fields ({selectedProfileFields.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-md p-4">
                {kycDetails.documents.map((doc) => (
                  <div key={doc.id} className="space-y-2 p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`correct-doc-${doc.id}`}
                        checked={selectedDocsForCorrection.includes(doc.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDocsForCorrection(prev => [...prev, doc.id]);
                          } else {
                            setSelectedDocsForCorrection(prev => prev.filter(id => id !== doc.id));
                            setDocumentComments(prev => {
                              const newComments = { ...prev };
                              delete newComments[doc.id];
                              return newComments;
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`correct-doc-${doc.id}`} className="font-medium cursor-pointer flex-1">
                        {doc.document_type.replace(/_/g, ' ').toUpperCase()}
                      </Label>
                    </div>
                    {selectedDocsForCorrection.includes(doc.id) && (
                      <Textarea
                        placeholder="Explain what needs to be corrected..."
                        value={documentComments[doc.id] || ''}
                        onChange={(e) => setDocumentComments(prev => ({
                          ...prev,
                          [doc.id]: e.target.value
                        }))}
                        rows={2}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-md p-4">
                {[
                  { field: 'id_number', label: 'ID Number', value: kycDetails.id_number },
                  { field: 'bvn', label: 'BVN', value: kycDetails.bvn },
                  { field: 'bank_name', label: 'Bank Name', value: kycDetails.bank_name },
                  { field: 'account_number', label: 'Account Number', value: kycDetails.account_number },
                  { field: 'account_name', label: 'Account Name', value: kycDetails.account_name },
                  { field: 'rc_number', label: 'RC Number', value: kycDetails.rc_number },
                  { field: 'tin_number', label: 'TIN Number', value: kycDetails.tin_number },
                ].filter(item => item.value).map((item) => (
                  <div key={item.field} className="space-y-2 p-3 border rounded-md">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={`correct-field-${item.field}`}
                        checked={selectedProfileFields.includes(item.field)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProfileFields(prev => [...prev, item.field]);
                          } else {
                            setSelectedProfileFields(prev => prev.filter(f => f !== item.field));
                            setProfileFieldComments(prev => {
                              const newComments = { ...prev };
                              delete newComments[item.field];
                              return newComments;
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`correct-field-${item.field}`} className="font-medium cursor-pointer">
                          {item.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Current: {item.value}
                        </p>
                      </div>
                    </div>
                    {selectedProfileFields.includes(item.field) && (
                      <Textarea
                        placeholder="Explain what needs to be corrected..."
                        value={profileFieldComments[item.field] || ''}
                        onChange={(e) => setProfileFieldComments(prev => ({
                          ...prev,
                          [item.field]: e.target.value
                        }))}
                        rows={2}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="general-corrections-comment">General Comments (Optional)</Label>
            <Textarea
              id="general-corrections-comment"
              placeholder="Add any general comments about the corrections needed..."
              value={correctionsComment}
              onChange={(e) => setCorrectionsComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionsDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleRequestCorrections} disabled={isSubmitting}>
              {isSubmitting ? 'Requesting...' : `Request Corrections (${selectedDocsForCorrection.length + selectedProfileFields.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
