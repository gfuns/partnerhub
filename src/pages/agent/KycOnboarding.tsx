import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Check, Upload, User, Briefcase, FileText, ArrowRight, ArrowLeft, LogOut, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  BusinessType, 
  KycProfile, 
  KycStatusResponse, 
  DocumentType,
  KycDocument,
  RequiredDocument,
  BUSINESS_TYPE_OPTIONS,
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
  DocumentStatus,
  getRequiredDocuments,
  KycCorrectionsData
} from '@/types/kyc';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import kycService from '@/services/api/kyc.service';

const STEPS = [
  { id: 1, title: 'Profile', description: 'Complete your profile' },
  { id: 2, title: 'Documents', description: 'Upload documents' },
  { id: 3, title: 'Submit', description: 'Review and submit' },
];

export default function KycOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, updateKycStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  const [profile, setProfile] = useState<Partial<KycProfile>>({});
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<DocumentType | null>(null);
  const [corrections, setCorrections] = useState<KycCorrectionsData | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect approved agents to dashboard
  if (user?.role?.startsWith('agent') && user?.kycStatus === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  // Load KYC status and data on mount
  useEffect(() => {
    loadKycData();
  }, []);

  const loadKycData = async () => {
    setIsLoading(true);
    try {
      // Load status
      const statusResponse = await kycService.getKycStatus();
      setKycStatus(statusResponse);

      // Load profile if exists
      const profileResponse = await kycService.getKycProfile();
      if (profileResponse.data.profile) {
        setProfile(profileResponse.data.profile);
      }

      // Load corrections from profile response if any
      if (profileResponse.data.corrections) {
        setCorrections(profileResponse.data.corrections);
      }

      // Load documents if business type is set
      if (profileResponse.data.profile?.business_type) {
        const docsResponse = await kycService.getDocuments();
        setDocuments(docsResponse.data.documents || []);
        setRequiredDocuments(docsResponse.data.required_documents || []);
      }

      // Auto-advance to documents if profile is complete
      if (statusResponse.data.profile_complete && !statusResponse.data.documents_complete) {
        setCurrentStep(2);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load KYC data',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Please try again',
      });
    }
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profile.business_type) {
      errors.business_type = 'Business type is required';
    }

    if (!profile.id_type) {
      errors.id_type = 'ID type is required';
    }

    if (!profile.id_number) {
      errors.id_number = 'ID number is required';
    }

    if (profile.business_type === 'individual') {
      if (!profile.date_of_birth) {
        errors.date_of_birth = 'Date of birth is required for individual';
      }
      if (!profile.gender) {
        errors.gender = 'Gender is required for individual';
      }
    }

    if ((profile.business_type === 'sme' || profile.business_type === 'corporate') && !profile.rc_number) {
      errors.rc_number = 'RC Number is required for SME/Corporate';
    }

    if (!profile.bank_name) {
      errors.bank_name = 'Bank name is required';
    }

    if (!profile.account_number) {
      errors.account_number = 'Account number is required';
    } else if (profile.account_number.length !== 10) {
      errors.account_number = 'Account number must be 10 digits';
    }

    if (!profile.account_name) {
      errors.account_name = 'Account name is required';
    }

    if (!profile.bvn) {
      errors.bvn = 'BVN is required';
    } else if (profile.bvn.length !== 11) {
      errors.bvn = 'BVN must be 11 digits';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveProfile = async () => {
    if (!validateProfile()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill all required fields correctly',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await kycService.updateKycProfile(profile);
      
      toast({
        title: 'Profile Saved',
        description: 'Your profile has been saved successfully',
      });

      // Reload data and move to next step
      await loadKycData();
      setCurrentStep(2);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to save profile',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    // Validate file
    const docConfig = requiredDocuments.find(d => d.type === documentType);
    if (!docConfig) return;

    if (file.size > docConfig.max_size_kb * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Maximum size is ${docConfig.max_size_kb / 1024}MB`,
      });
      return;
    }

    if (!docConfig.allowed_types.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: `Allowed types: ${docConfig.allowed_types.join(', ')}`,
      });
      return;
    }

    setUploadingDoc(documentType);
    try {
      await kycService.uploadDocument(documentType, file);
      
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully',
      });

      // Reload documents
      const docsResponse = await kycService.getDocuments();
      setDocuments(docsResponse.data.documents || []);
      
      // Reload status to update completion
      const statusResponse = await kycService.getKycStatus();
      setKycStatus(statusResponse);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await kycService.deleteDocument(docId);
      
      toast({
        title: 'Document Deleted',
        description: 'The document has been removed',
      });

      // Reload documents
      const docsResponse = await kycService.getDocuments();
      setDocuments(docsResponse.data.documents || []);
      
      // Reload status
      const statusResponse = await kycService.getKycStatus();
      setKycStatus(statusResponse);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete',
        description: error.response?.data?.message || 'Please try again',
      });
    }
  };

  const handleSubmitKyc = async () => {
    if (!kycStatus?.data.can_submit) {
      toast({
        variant: 'destructive',
        title: 'Cannot Submit',
        description: 'Please complete your profile and upload all required documents',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.submitKyc();
      
      // Update KYC status in auth context
      const newKycStatus = response.data.kyc_status;
      updateKycStatus(newKycStatus, false);
      
      toast({
        title: 'KYC Submitted',
        description: response.message || 'Your application has been submitted for review',
      });

      // Navigate based on KYC status after brief delay
      setTimeout(() => {
        if (newKycStatus === 'pending_review') {
          navigate('/kyc-pending');
        } else {
          // Fallback to dashboard for other statuses
          navigate('/dashboard');
        }
      }, 1000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.response?.data?.message || 'Please try again',
      });
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return kycStatus?.data.profile_complete;
      case 2:
        return kycStatus?.data.documents_complete;
      case 3:
        return kycStatus?.data.can_submit;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      saveProfile();
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading KYC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user ? `${user.firstName} ${user.lastName}` : ''}</p>
              <p className="text-xs text-muted-foreground">KYC Onboarding</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Corrections Alert */}
        {corrections && (
          <Alert className="mb-6 border-orange-500 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertDescription>
              <div className="space-y-4">
                <div>
                  <div className="font-semibold text-orange-900 mb-1">
                    Corrections Required ({corrections.total_corrections})
                  </div>
                  {corrections.reviewer && (
                    <div className="text-sm text-orange-800">
                      Reviewed by {corrections.reviewer.name} on {new Date(corrections.reviewed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {corrections.general_comment && (
                  <div className="bg-white/50 rounded-md p-3 border border-orange-200">
                    <div className="font-medium text-sm text-orange-900 mb-1">General Feedback:</div>
                    <p className="text-sm text-orange-800">{corrections.general_comment}</p>
                  </div>
                )}

                {corrections.document_corrections && corrections.document_corrections.length > 0 && (
                  <div>
                    <div className="font-medium text-sm text-orange-900 mb-2">Document Corrections:</div>
                    <ul className="space-y-2">
                      {corrections.document_corrections.map((doc: any, idx: number) => {
                        const document = documents.find(d => d.id === doc.document_id);
                        return (
                          <li key={idx} className="bg-white/50 rounded-md p-3 border border-orange-200">
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 text-orange-600 mt-0.5" />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-orange-900">
                                  {document?.document_label || `Document #${doc.document_id}`}
                                </div>
                                <p className="text-sm text-orange-700 mt-1">{doc.comment}</p>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {corrections.profile_corrections && corrections.profile_corrections.length > 0 && (
                  <div>
                    <div className="font-medium text-sm text-orange-900 mb-2">Profile Field Corrections:</div>
                    <ul className="space-y-2">
                      {corrections.profile_corrections.map((field: any, idx: number) => (
                        <li key={idx} className="bg-white/50 rounded-md p-3 border border-orange-200">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-orange-900 capitalize">
                                {field.field_name.replace(/_/g, ' ')}
                              </div>
                              {field.current_value && (
                                <div className="text-xs text-orange-600 mt-0.5">
                                  Current: {field.current_value}
                                </div>
                              )}
                              <p className="text-sm text-orange-700 mt-1">{field.comment}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors',
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn(
                      'text-sm font-medium',
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-2',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Completion Progress */}
        {kycStatus && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completion Progress</span>
                <span className="text-sm font-medium">{kycStatus.data.completion_percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${kycStatus.data.completion_percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Profile */}
            {currentStep === 1 && (
              <ProfileStep
                profile={profile}
                setProfile={setProfile}
                errors={profileErrors}
              />
            )}

            {/* Step 2: Documents */}
            {currentStep === 2 && (
              <DocumentsStep
                businessType={profile.business_type}
                documents={documents}
                requiredDocuments={requiredDocuments}
                uploadingDoc={uploadingDoc}
                onFileUpload={handleFileUpload}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {/* Step 3: Submit */}
            {currentStep === 3 && (
              <SubmitStep
                profile={profile}
                documents={documents}
                kycStatus={kycStatus}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentStep === 1 ? 'Save & Continue' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitKyc} 
              disabled={!kycStatus?.data.can_submit || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Step Component
interface ProfileStepProps {
  profile: Partial<KycProfile>;
  setProfile: (profile: Partial<KycProfile>) => void;
  errors: Record<string, string>;
}

function ProfileStep({ profile, setProfile, errors }: ProfileStepProps) {
  const updateField = (field: keyof KycProfile, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Business Type Selection */}
      <div className="space-y-3">
        <Label>Business Type *</Label>
        <div className="grid gap-3 md:grid-cols-3">
          {BUSINESS_TYPE_OPTIONS.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateField('business_type', type.value)}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                profile.business_type === type.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {type.value === 'individual' ? <User className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                <h3 className="font-medium text-sm">{type.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </button>
          ))}
        </div>
        {errors.business_type && <p className="text-sm text-destructive">{errors.business_type}</p>}
      </div>

      {/* ID Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="id_type">ID Type *</Label>
          <Select value={profile.id_type} onValueChange={(value: any) => updateField('id_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.id_type && <p className="text-sm text-destructive">{errors.id_type}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_number">ID Number *</Label>
          <Input
            id="id_number"
            value={profile.id_number || ''}
            onChange={(e) => updateField('id_number', e.target.value)}
            placeholder="Enter ID number"
          />
          {errors.id_number && <p className="text-sm text-destructive">{errors.id_number}</p>}
        </div>
      </div>

      {/* Individual-specific fields */}
      {profile.business_type === 'individual' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={profile.date_of_birth || ''}
              onChange={(e) => updateField('date_of_birth', e.target.value)}
            />
            {errors.date_of_birth && <p className="text-sm text-destructive">{errors.date_of_birth}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={profile.gender} onValueChange={(value: any) => updateField('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
          </div>
        </div>
      )}

      {/* SME/Corporate-specific fields */}
      {(profile.business_type === 'sme' || profile.business_type === 'corporate') && (
        <div className="space-y-2">
          <Label htmlFor="rc_number">RC Number *</Label>
          <Input
            id="rc_number"
            value={profile.rc_number || ''}
            onChange={(e) => updateField('rc_number', e.target.value)}
            placeholder="Enter CAC registration number"
          />
          {errors.rc_number && <p className="text-sm text-destructive">{errors.rc_number}</p>}
        </div>
      )}

      {/* TIN Number (optional for all) */}
      <div className="space-y-2">
        <Label htmlFor="tin_number">TIN Number (Optional)</Label>
        <Input
          id="tin_number"
          value={profile.tin_number || ''}
          onChange={(e) => updateField('tin_number', e.target.value)}
          placeholder="Enter tax identification number"
        />
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <h4 className="font-medium">Bank Details</h4>
        
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name *</Label>
          <Input
            id="bank_name"
            value={profile.bank_name || ''}
            onChange={(e) => updateField('bank_name', e.target.value)}
            placeholder="e.g., First Bank, GTBank"
          />
          {errors.bank_name && <p className="text-sm text-destructive">{errors.bank_name}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number *</Label>
            <Input
              id="account_number"
              type="text"
              inputMode="numeric"
              value={profile.account_number || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                updateField('account_number', value);
              }}
              placeholder="10 digits"
              maxLength={10}
              autoComplete="off"
            />
            {errors.account_number && <p className="text-sm text-destructive">{errors.account_number}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name *</Label>
            <Input
              id="account_name"
              value={profile.account_name || ''}
              onChange={(e) => updateField('account_name', e.target.value)}
              placeholder="Account holder name"
            />
            {errors.account_name && <p className="text-sm text-destructive">{errors.account_name}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bvn">BVN *</Label>
          <Input
            id="bvn"
            type="text"
            inputMode="numeric"
            value={profile.bvn || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              updateField('bvn', value);
            }}
            placeholder="11 digits"
            maxLength={11}
            autoComplete="off"
          />
          {errors.bvn && <p className="text-sm text-destructive">{errors.bvn}</p>}
        </div>
      </div>
    </div>
  );
}

// Documents Step Component
interface DocumentsStepProps {
  businessType?: BusinessType;
  documents: KycDocument[];
  requiredDocuments: RequiredDocument[];
  uploadingDoc: DocumentType | null;
  onFileUpload: (type: DocumentType, file: File) => void;
  onDeleteDocument: (id: number) => void;
}

function DocumentsStep({ 
  businessType, 
  documents, 
  requiredDocuments,
  uploadingDoc,
  onFileUpload,
  onDeleteDocument
}: DocumentsStepProps) {
  if (!businessType) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please complete your profile first before uploading documents.
        </AlertDescription>
      </Alert>
    );
  }

  const getDocumentStatus = (docType: DocumentType): DocumentStatus => {
    const doc = documents.find(d => d.document_type === docType);
    return doc?.status || 'not_uploaded';
  };

  const getDocumentId = (docType: DocumentType): number | null => {
    const doc = documents.find(d => d.document_type === docType);
    return doc?.id || null;
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-1">Document Requirements</div>
          <ul className="text-sm list-disc list-inside space-y-1">
            {requiredDocuments.filter(d => d.required).map((doc) => (
              <li key={doc.type}>
                {doc.label} - Max {doc.max_size_kb / 1024}MB
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>

      {requiredDocuments.map((docConfig) => (
        <DocumentUploadCard
          key={docConfig.type}
          config={docConfig}
          status={getDocumentStatus(docConfig.type)}
          documentId={getDocumentId(docConfig.type)}
          isUploading={uploadingDoc === docConfig.type}
          onUpload={onFileUpload}
          onDelete={onDeleteDocument}
        />
      ))}
    </div>
  );
}

// Document Upload Card Component
interface DocumentUploadCardProps {
  config: RequiredDocument;
  status: DocumentStatus;
  documentId: number | null;
  isUploading: boolean;
  onUpload: (type: DocumentType, file: File) => void;
  onDelete: (id: number) => void;
}

function DocumentUploadCard({ 
  config, 
  status, 
  documentId,
  isUploading,
  onUpload,
  onDelete
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(config.type, file);
    }
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
    <div className={cn(
      'p-4 border-2 rounded-lg transition-colors',
      isUploaded ? 'border-primary/30 bg-primary/5' : 'border-border'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            'p-2 rounded-lg',
            isUploaded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {isUploaded ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{config.label}</h4>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">
              {config.allowed_types.join(', ')} • Max {config.max_size_kb / 1024}MB
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canUpload && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={config.allowed_types.join(',')}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <Button
                variant={isUploaded ? 'outline' : 'default'}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploaded ? 'Replace' : 'Upload'}
              </Button>
            </>
          )}
          
          {isUploaded && documentId && status !== 'approved' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(documentId)}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Submit Step Component
interface SubmitStepProps {
  profile: Partial<KycProfile>;
  documents: KycDocument[];
  kycStatus: KycStatusResponse | null;
}

function SubmitStep({ profile, documents, kycStatus }: SubmitStepProps) {
  const getBusinessTypeLabel = () => {
    const option = BUSINESS_TYPE_OPTIONS.find(o => o.value === profile.business_type);
    return option?.label || profile.business_type;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div>
        <h4 className="font-medium mb-4">Profile Summary</h4>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Business Type:</span>
            <span className="font-medium">{getBusinessTypeLabel()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID Type:</span>
            <span className="font-medium capitalize">{profile.id_type?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID Number:</span>
            <span className="font-medium">{profile.id_number}</span>
          </div>
          {profile.rc_number && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">RC Number:</span>
              <span className="font-medium">{profile.rc_number}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bank:</span>
            <span className="font-medium">{profile.bank_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account:</span>
            <span className="font-medium">{profile.account_number} - {profile.account_name}</span>
          </div>
        </div>
      </div>

      {/* Documents Summary */}
      <div>
        <h4 className="font-medium mb-4">Uploaded Documents</h4>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{doc.document_label}</span>
              </div>
              <span className={cn(
                'text-xs px-2 py-1 rounded-full font-medium',
                doc.status === 'approved' && 'bg-green-500/10 text-green-600',
                doc.status === 'pending' && 'bg-yellow-500/10 text-yellow-600',
                doc.status === 'rejected' && 'bg-red-500/10 text-red-600',
              )}>
                {doc.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Check */}
      {!kycStatus?.data.can_submit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Cannot Submit Yet</div>
            <ul className="text-sm list-disc list-inside space-y-1">
              {!kycStatus?.data.profile_complete && <li>Complete your profile</li>}
              {!kycStatus?.data.documents_complete && <li>Upload all required documents</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {kycStatus?.data.can_submit && (
        <Alert className="border-primary">
          <Check className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Ready to Submit</div>
            <p className="text-sm mt-1">
              Your KYC application is complete and ready for submission. 
              Once submitted, our team will review your application within 24-48 hours.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
