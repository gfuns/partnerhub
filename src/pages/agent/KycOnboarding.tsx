import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Check, Upload, Building2, User, Briefcase, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { BusinessType, KycSubmission } from '@/types/kyc';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { id: 1, title: 'Business Type', description: 'Select your business type' },
  { id: 2, title: 'Basic Information', description: 'Enter your details' },
  { id: 3, title: 'Documents', description: 'Upload required documents' },
  { id: 4, title: 'Declaration', description: 'Confirm and submit' },
];

const BUSINESS_TYPES = [
  { id: 'individual_trader' as BusinessType, label: 'Individual Trader', description: 'Sole proprietor or freelancer', icon: User },
  { id: 'registered_business' as BusinessType, label: 'Registered Business', description: 'CAC registered business', icon: Building2 },
  { id: 'corporate' as BusinessType, label: 'Corporate', description: 'Limited liability company', icon: Briefcase },
];

export default function KycOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<KycSubmission>>({
    declarationAccepted: false,
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect approved agents to dashboard
  if (user?.role === 'agent' && user?.kycStatus === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect pending_review/rejected/suspended to appropriate page
  if (user?.role === 'agent' && user?.kycStatus && user.kycStatus !== 'pending_onboarding') {
    return <Navigate to={`/kyc-pending?status=${user.kycStatus}`} replace />;
  }

  const updateField = (field: keyof KycSubmission, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.businessType;
      case 2:
        return !!(formData.fullName && formData.phoneNumber && formData.email);
      case 3:
        if (formData.businessType === 'individual_trader') {
          return !!(formData.governmentIdUrl && formData.passportPhotoUrl);
        } else if (formData.businessType === 'registered_business') {
          return !!(formData.cacNumber && formData.directorIdUrl && formData.businessAddressProofUrl);
        } else {
          return !!(formData.companyDocumentsUrl && formData.directorsListUrl);
        }
      case 4:
        return formData.declarationAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'KYC Submitted Successfully',
      description: 'Your details are now under review. We will notify you once approved.',
    });
    
    // Redirect to pending review screen
    navigate('/kyc-pending');
    setIsSubmitting(false);
  };

  const simulateUpload = (field: keyof KycSubmission) => {
    // Simulate file upload
    updateField(field, `https://storage.example.com/${field}-${Date.now()}.pdf`);
    toast({
      title: 'Document Uploaded',
      description: 'Your document has been uploaded successfully.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <span className="text-sm text-muted-foreground">KYC Onboarding</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
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
                  <div className="mt-2 text-center hidden sm:block">
                    <p className={cn(
                      'text-sm font-medium',
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {step.title}
                    </p>
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

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Business Type Selection */}
            {currentStep === 1 && (
              <div className="grid gap-4 md:grid-cols-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => updateField('businessType', type.id)}
                      className={cn(
                        'p-6 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                        formData.businessType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                    >
                      <Icon className={cn(
                        'h-8 w-8 mb-3',
                        formData.businessType === type.id ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <h3 className="font-medium">{type.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Basic Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ''}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={(e) => updateField('phoneNumber', e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                {formData.businessType !== 'individual_trader' && (
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName || ''}
                      onChange={(e) => updateField('businessName', e.target.value)}
                      placeholder="Enter business name"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {formData.businessType === 'individual_trader' && (
                  <>
                    <DocumentUpload
                      label="Government ID"
                      description="Upload a valid government-issued ID (NIN, Driver's License, Voter's Card)"
                      uploaded={!!formData.governmentIdUrl}
                      onUpload={() => simulateUpload('governmentIdUrl')}
                    />
                    <DocumentUpload
                      label="Passport Photo"
                      description="Upload a recent passport photograph"
                      uploaded={!!formData.passportPhotoUrl}
                      onUpload={() => simulateUpload('passportPhotoUrl')}
                    />
                  </>
                )}

                {formData.businessType === 'registered_business' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cacNumber">CAC Number *</Label>
                      <Input
                        id="cacNumber"
                        value={formData.cacNumber || ''}
                        onChange={(e) => updateField('cacNumber', e.target.value)}
                        placeholder="Enter CAC registration number"
                      />
                    </div>
                    <DocumentUpload
                      label="Director's ID"
                      description="Upload the ID of a company director"
                      uploaded={!!formData.directorIdUrl}
                      onUpload={() => simulateUpload('directorIdUrl')}
                    />
                    <DocumentUpload
                      label="Business Address Proof"
                      description="Upload a utility bill or lease agreement"
                      uploaded={!!formData.businessAddressProofUrl}
                      onUpload={() => simulateUpload('businessAddressProofUrl')}
                    />
                  </>
                )}

                {formData.businessType === 'corporate' && (
                  <>
                    <DocumentUpload
                      label="Company Documents"
                      description="Upload CAC certificate, memorandum & articles of association"
                      uploaded={!!formData.companyDocumentsUrl}
                      onUpload={() => simulateUpload('companyDocumentsUrl')}
                    />
                    <DocumentUpload
                      label="Directors List"
                      description="Upload list of directors with their IDs"
                      uploaded={!!formData.directorsListUrl}
                      onUpload={() => simulateUpload('directorsListUrl')}
                    />
                  </>
                )}
              </div>
            )}

            {/* Step 4: Declaration */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Summary</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Type:</span>
                      <span className="font-medium capitalize">{formData.businessType?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Full Name:</span>
                      <span className="font-medium">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{formData.phoneNumber}</span>
                    </div>
                    {formData.businessName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Business Name:</span>
                        <span className="font-medium">{formData.businessName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="declaration"
                    checked={formData.declarationAccepted}
                    onCheckedChange={(checked) => updateField('declarationAccepted', !!checked)}
                  />
                  <label htmlFor="declaration" className="text-sm leading-relaxed cursor-pointer">
                    I confirm that the information provided is accurate and complete to the best of my knowledge. 
                    I understand that providing false information may result in the rejection of my application.
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DocumentUploadProps {
  label: string;
  description: string;
  uploaded: boolean;
  onUpload: () => void;
}

function DocumentUpload({ label, description, uploaded, onUpload }: DocumentUploadProps) {
  return (
    <div className={cn(
      'p-4 border-2 border-dashed rounded-lg transition-colors',
      uploaded ? 'border-primary bg-primary/5' : 'border-border'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            uploaded ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}>
            {uploaded ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-medium">{label}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          variant={uploaded ? 'outline' : 'default'}
          size="sm"
          onClick={onUpload}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploaded ? 'Replace' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
