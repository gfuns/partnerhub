import { useEffect, useState, useRef } from 'react';
import { Check, Upload, FileText, Loader2, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import partnerAgentKycService from '@/services/api/partnerAgentKyc.service';
import { useAuth } from '@/contexts/AuthContext';
import { agentsService } from '@/services/api/agents.service';
import {
  RequiredDocument,
  DocumentType,
  KycDocument,
  KycStatusResponse,
  BUSINESS_TYPE_OPTIONS,
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
  DocumentStatus,
} from '@/types/kyc';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: number;
  onSuccess?: () => void;
};

const STEPS = [
  { id: 1, title: 'Profile' },
  { id: 2, title: 'Documents' },
  { id: 3, title: 'Submit' },
];

export default function OnboardAgentModal({ open, onOpenChange, agentId, onSuccess }: Props) {
  const { toast } = useToast();
  const { getAssetUrl } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [banks, setBanks] = useState<any[]>([]);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<DocumentType | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) loadKycData();
    else resetState();
  }, [open]);

  const resetState = () => {
    setCurrentStep(1);
    setIsLoading(false);
    setIsSubmitting(false);
    setKycStatus(null);
    setProfile({});
    setDocuments([]);
    setRequiredDocuments([]);
    setUploadingDoc(null);
    setProfileErrors({});
  };

  const loadKycData = async () => {
    setIsLoading(true);
    try {
      const [statusResp, profileResp, docsResp] = await Promise.all([
        partnerAgentKycService.getStatus(agentId).catch(() => null),
        partnerAgentKycService.getProfile(agentId).catch(() => null),
        partnerAgentKycService.getDocuments(agentId).catch(() => null),
      ]);

      if (statusResp?.data) setKycStatus(statusResp);
      if (profileResp?.data?.profile) setProfile(profileResp.data.profile);
      if (docsResp?.data) {
        setDocuments(docsResp.data.documents || []);
        setRequiredDocuments(docsResp.data.required_documents || []);
      }

      // load banks for bank select
      try {
        const banksResp = await agentsService.getBanks();
        setBanks(banksResp.data ?? banksResp?.data ?? banksResp ?? []);
      } catch (err) {
        // ignore
      }

      // Auto-advance logic similar to KycOnboarding
      if (statusResp?.data?.profile_complete && !statusResp?.data?.documents_complete) {
        setCurrentStep(2);
      }
    } catch (err) {
      console.warn('Failed to load partner onboarding data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profile.business_type) errors.business_type = 'Business type is required';
    if (!profile.id_type) errors.id_type = 'ID type is required';
    if (!profile.id_number) errors.id_number = 'ID number is required';

    if (profile.business_type === 'individual') {
      if (!profile.date_of_birth) errors.date_of_birth = 'Date of birth is required for individual';
      if (!profile.gender) errors.gender = 'Gender is required for individual';
    }

    if ((profile.business_type === 'sme' || profile.business_type === 'corporate') && !profile.rc_number) {
      errors.rc_number = 'RC Number is required for SME/Corporate';
    }

    if (!profile.bank_code && !profile.bank_name) errors.bank_name = 'Bank name is required';
    if (!profile.account_number) errors.account_number = 'Account number is required';
    else if (profile.account_number && profile.account_number.toString().length !== 10) errors.account_number = 'Account number must be 10 digits';
    if (!profile.account_name) errors.account_name = 'Account name is required';
    if (!profile.bvn) errors.bvn = 'BVN is required';
    else if (profile.bvn && profile.bvn.toString().length !== 11) errors.bvn = 'BVN must be 11 digits';

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProfile = async () => {
    if (!validateProfile()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields correctly' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure we send bank_code and bank_name when available
      const payload = { ...profile };
      if (profile.bank_code && !payload.bank_name) {
        const found = banks.find(b => (b.code && b.code === profile.bank_code) || (b.id && b.id.toString() === profile.bank_code));
        if (found) payload.bank_name = found.name;
      }
      await partnerAgentKycService.updateProfile(agentId, payload);
      toast({ title: 'Profile Saved', description: 'Profile saved successfully' });
      await loadKycData();
      setCurrentStep(2);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to save profile', description: err?.response?.data?.message || 'Please try again' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    const docConfig = requiredDocuments.find(d => d.type === documentType);
    if (!docConfig) return;

    if (file.size > docConfig.max_size_kb * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: `Maximum size is ${docConfig.max_size_kb / 1024}MB` });
      return;
    }

    if (!docConfig.allowed_types.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: `Allowed types: ${docConfig.allowed_types.join(', ')}` });
      return;
    }

    setUploadingDoc(documentType);
    try {
      await partnerAgentKycService.uploadDocument(agentId, file, documentType);
      toast({ title: 'Document Uploaded', description: 'Your document has been uploaded successfully' });
      const docsResp = await partnerAgentKycService.getDocuments(agentId);
      setDocuments(docsResp.data.documents || []);
      const statusResp = await partnerAgentKycService.getStatus(agentId);
      setKycStatus(statusResp);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err?.response?.data?.message || 'Please try again' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const verifyAccount = async () => {
    if (!profile.account_number || (!profile.bank_code && !profile.bank_name)) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select bank and enter account number' });
      return;
    }

    setIsVerifyingAccount(true);
    try {
      const bankCode = profile.bank_code || null;
      const resp = await agentsService.verifyAccount({ account_number: profile.account_number, bank_code: bankCode });
      const accountName = resp.data.accountName || resp.data.account_name || resp.data.name;
      if (accountName) {
        setProfile({ ...profile, account_name: accountName });
        toast({ title: 'Account Verified', description: 'Account name populated' });
      } else {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'Could not verify account' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Verification Failed', description: err?.response?.data?.message || 'Failed to verify account' });
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await partnerAgentKycService.deleteDocument(agentId, docId);
      toast({ title: 'Document Deleted', description: 'The document has been removed' });
      const docsResp = await partnerAgentKycService.getDocuments(agentId);
      setDocuments(docsResp.data.documents || []);
      const statusResp = await partnerAgentKycService.getStatus(agentId);
      setKycStatus(statusResp);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: err?.response?.data?.message || 'Please try again' });
    }
  };

  const handleSubmitKyc = async () => {
    if (!kycStatus?.data?.can_submit) {
      toast({ variant: 'destructive', title: 'Cannot Submit', description: 'Please complete your profile and upload all required documents' });
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await partnerAgentKycService.submit(agentId);
      toast({ title: 'KYC Submitted', description: resp?.message || 'Your application has been submitted for review' });
      onOpenChange(false);
      onSuccess && onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Submission failed', description: err?.response?.data?.message || 'Please try again' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document Upload Card (similar to KycOnboarding)
  function DocumentUploadCard({ config, status, documentId, isUploading }: {
    config: RequiredDocument;
    status: DocumentStatus;
    documentId: number | null;
    isUploading: boolean;
  }) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(config.type, file);
    };

    const getStatusBadge = () => {
      switch (status) {
        case 'approved':
          return <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">Approved</span>;
        case 'pending':
          return <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">Under Review</span>;
        case 'rejected':
          return <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">Rejected</span>;
        case 'needs_correction':
          return <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 font-medium">Needs Correction</span>;
        default:
          return config.required && <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Required</span>;
      }
    };

    const isUploaded = status !== 'not_uploaded';
    const canUpload = status === 'not_uploaded' || status === 'rejected' || status === 'needs_correction';

    return (
      <div className={cn('p-4 border-2 rounded-lg transition-colors', isUploaded ? 'border-primary/30 bg-primary/5' : 'border-border')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('p-2 rounded-lg', isUploaded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
              {isUploaded ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{config.label}</h4>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground">{config.allowed_types.join(', ')} • Max {config.max_size_kb / 1024}MB</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canUpload && (
              <>
                <input type="file" ref={fileInputRef} className="hidden" accept={config.allowed_types.join(',')} onChange={handleFileSelect} disabled={isUploading} />
                <Button variant={isUploaded ? 'outline' : 'default'} size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isUploaded ? 'Replace' : 'Upload'}
                </Button>
              </>
            )}

            {isUploaded && documentId && status !== 'approved' && (
              <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(documentId)} disabled={isUploading}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Onboard Agent</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">Loading KYC data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Onboard Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Steps header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors',
                      currentStep > s.id ? 'bg-primary text-primary-foreground' : currentStep === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
                    >
                      {currentStep > s.id ? <Check className="h-5 w-5" /> : s.id}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={cn('text-sm font-medium', currentStep >= s.id ? 'text-foreground' : 'text-muted-foreground')}>{s.title}</p>
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && <div className={cn('h-0.5 flex-1 mx-2', currentStep > s.id ? 'bg-primary' : 'bg-muted')} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Business Type - simple input selection to keep modal compact */}
              <div className="space-y-3">
                <Label>Business Type *</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  {BUSINESS_TYPE_OPTIONS.map((type) => (
                    <button key={type.value} type="button" onClick={() => setProfile({ ...profile, business_type: type.value })} className={cn('p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50', profile.business_type === type.value ? 'border-primary bg-primary/5' : 'border-border')}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm">{type.label}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
                {profileErrors.business_type && <p className="text-sm text-destructive">{profileErrors.business_type}</p>}
              </div>

              {/* ID & personal fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ID Type *</Label>
                  <Select value={profile.id_type} onValueChange={(v: any) => setProfile({ ...profile, id_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {profileErrors.id_type && <p className="text-sm text-destructive">{profileErrors.id_type}</p>}
                </div>

                <div className="space-y-2">
                  <Label>ID Number *</Label>
                  <Input value={profile.id_number || ''} onChange={(e) => setProfile({ ...profile, id_number: e.target.value })} />
                  {profileErrors.id_number && <p className="text-sm text-destructive">{profileErrors.id_number}</p>}
                </div>
              </div>

              {profile.business_type === 'individual' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    <Input type="date" value={profile.date_of_birth || ''} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />
                    {profileErrors.date_of_birth && <p className="text-sm text-destructive">{profileErrors.date_of_birth}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select value={profile.gender} onValueChange={(v: any) => setProfile({ ...profile, gender: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (<SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {profileErrors.gender && <p className="text-sm text-destructive">{profileErrors.gender}</p>}
                  </div>
                </div>
              )}

              {(profile.business_type === 'sme' || profile.business_type === 'corporate') && (
                <div className="space-y-2">
                  <Label>RC Number *</Label>
                  <Input value={profile.rc_number || ''} onChange={(e) => setProfile({ ...profile, rc_number: e.target.value })} />
                  {profileErrors.rc_number && <p className="text-sm text-destructive">{profileErrors.rc_number}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>TIN Number (Optional)</Label>
                <Input value={profile.tin_number || ''} onChange={(e) => setProfile({ ...profile, tin_number: e.target.value })} />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Bank Details</h4>
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Select value={profile.bank_code || profile.bank_name || ''} onValueChange={(v: any) => {
                    // v is bank.code or id string
                    setProfile(prev => ({ ...prev, bank_code: v }));
                    // find bank name and set
                    const found = banks.find(b => (b.code && b.code === v) || (b.id && b.id.toString() === v));
                    if (found) setProfile(prev => ({ ...prev, bank_name: found.name }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={banks.length ? 'Select bank' : 'Loading banks...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id ?? bank.code} value={bank.code ?? (bank.id?.toString() ?? '')}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {profileErrors.bank_name && <p className="text-sm text-destructive">{profileErrors.bank_name}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <div className="flex gap-2">
                      <Input value={profile.account_number || ''} onChange={(e) => setProfile({ ...profile, account_number: e.target.value.replace(/\D/g, '') })} maxLength={10} />
                      <Button variant="outline" onClick={verifyAccount} disabled={isVerifyingAccount || !profile.account_number || profile.account_number.toString().length !== 10 || (!profile.bank_code && !profile.bank_name)}>
                        {isVerifyingAccount ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                    {profileErrors.account_number && <p className="text-sm text-destructive">{profileErrors.account_number}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Account Name *</Label>
                    <Input value={profile.account_name || ''} disabled className="bg-muted" />
                    {profileErrors.account_name && <p className="text-sm text-destructive">{profileErrors.account_name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>BVN *</Label>
                  <Input value={profile.bvn || ''} onChange={(e) => setProfile({ ...profile, bvn: e.target.value.replace(/\D/g, '') })} maxLength={11} />
                  {profileErrors.bvn && <p className="text-sm text-destructive">{profileErrors.bvn}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Document Requirements</div>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {requiredDocuments.filter(d => d.required).map((doc) => (
                      <li key={doc.type}>{doc.label} - Max {doc.max_size_kb / 1024}MB</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              {requiredDocuments.map((docConfig) => {
                const doc = documents.find(d => d.document_type === docConfig.type);
                const status = (doc?.status || 'not_uploaded') as DocumentStatus;
                const documentId = doc?.id || null;
                return (
                  <div key={docConfig.type} className="mb-4">
                    <DocumentUploadCard config={docConfig} status={status} documentId={documentId} isUploading={uploadingDoc === docConfig.type} />
                  </div>
                );
              })}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-medium">Review & Submit</h4>
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium">Profile Summary</h5>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Business Type:</span><span className="font-medium">{BUSINESS_TYPE_OPTIONS.find(o => o.value === profile.business_type)?.label || profile.business_type || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">ID Type:</span><span className="font-medium">{ID_TYPE_OPTIONS.find(o => o.value === profile.id_type)?.label || profile.id_type || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">ID Number:</span><span className="font-medium">{profile.id_number || '-'}</span></div>
                    {profile.rc_number && <div className="flex justify-between"><span className="text-muted-foreground">RC Number:</span><span className="font-medium">{profile.rc_number}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Bank:</span><span className="font-medium">{profile.bank_name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account:</span><span className="font-medium">{(profile.account_number || '-') + (profile.account_name ? ` - ${profile.account_name}` : '')}</span></div>
                    {profile.date_of_birth && <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth:</span><span className="font-medium">{new Date(profile.date_of_birth).toLocaleDateString()}</span></div>}
                    {profile.gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span><span className="font-medium">{GENDER_OPTIONS.find(g => g.value === profile.gender)?.label || profile.gender}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">BVN:</span><span className="font-medium">{profile.bvn || '-'}</span></div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium">Documents</h5>
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{d.document_label}</p>
                          <p className="text-sm text-muted-foreground">{d.status}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open(getAssetUrl(d.file_url) || '', '_blank')}>View</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!kycStatus?.data?.can_submit && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Cannot Submit Yet</div>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {!kycStatus?.data?.profile_complete && <li>Complete the profile</li>}
                      {!kycStatus?.data?.documents_complete && <li>Upload all required documents</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {kycStatus?.data?.can_submit && (
                <Alert className="border-primary">
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Ready to Submit</div>
                    <p className="text-sm mt-1">Your KYC application is complete and ready for submission. Once submitted, our team will review your application within 24-48 hours.</p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}>Back</Button>}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            </div>

            <div className="flex gap-2">
              {currentStep < 3 && (
                <Button onClick={async () => {
                  if (currentStep === 1) await saveProfile();
                  else if (currentStep === 2) setCurrentStep(3);
                }} disabled={isSubmitting}>{isSubmitting ? 'Please wait' : currentStep === 1 ? 'Save & Continue' : 'Continue'}</Button>
              )}

              {currentStep === 3 && <Button onClick={handleSubmitKyc} disabled={!kycStatus?.data?.can_submit || isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</Button>}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
