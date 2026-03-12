import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Check, Upload, Building2, FileText, ArrowRight, ArrowLeft, 
  LogOut, AlertCircle, Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import partnerKycService, {
  BusinessCategory,
  FormField,
  KycStatusResponse,
} from '@/services/api/partnerKyc.service';

const STEPS = [
  { id: 1, title: 'Category', description: 'Select business category', icon: Building2 },
  { id: 2, title: 'Profile', description: 'Complete your profile', icon: FileText },
  { id: 3, title: 'Submit', description: 'Review and submit', icon: Check },
];

export default function PartnerKycOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, updateKycStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatusResponse | null>(null);
  
  // Step 1: Categories
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Step 2: Profile
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadKycData();
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect approved partners to dashboard
  if (user?.kycStatus === 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect pending_review, rejected, or suspended partners to pending page
  if (user?.kycStatus === 'pending_review' || user?.kycStatus === 'rejected' || user?.kycStatus === 'suspended') {
    return <Navigate to="/partner-kyc-pending" replace />;
  }

  const loadKycData = async () => {
    setIsLoading(true);
    try {
      // Load KYC status
      const statusResponse = await partnerKycService.getKycStatus();
      setKycStatus(statusResponse.data);

      // Load business categories
      const categoriesResponse = await partnerKycService.getBusinessCategories();
      setCategories(categoriesResponse.data);

      // Load saved profile if exists
      try {
        const profileResponse = await partnerKycService.getProfile();
        if (profileResponse.data.business_category) {
          setSelectedCategory(profileResponse.data.business_category);
          setProfileData(profileResponse.data.data || {});
          
          // Load requirements for saved category
          await loadCategoryRequirements(profileResponse.data.business_category);
          
          // Auto-advance to review step if profile exists
          if (Object.keys(profileResponse.data.data || {}).length > 0) {
            setCurrentStep(3); // Review step
          } else {
            setCurrentStep(2); // Profile step
          }
        }
      } catch (error) {
        // No saved profile yet, that's okay
        console.log('No saved profile');
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

  const loadCategoryRequirements = async (categorySlug: string) => {
    try {
      const response = await partnerKycService.getCategoryFields(categorySlug);
      setFormFields(response.data.fields);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load requirements',
        description: error.response?.data?.message || 'Please try again',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/partner');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Please try again',
      });
    }
  };

  const handleCategorySelect = async (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    await loadCategoryRequirements(categorySlug);
  };

  const handleNextFromCategory = () => {
    if (!selectedCategory) {
      toast({
        variant: 'destructive',
        title: 'Category required',
        description: 'Please select a business category',
      });
      return;
    }
    setCurrentStep(2);
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    formFields.forEach((field) => {
      if (field.is_required && !profileData[field.label]) {
        errors[field.label] = `${field.label} is required`;
      }
    });

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      toast({
        variant: 'destructive',
        title: 'Validation failed',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await partnerKycService.saveProfile({
        business_category: selectedCategory,
        data: profileData,
      });

      toast({
        title: 'Progress saved',
        description: 'Your profile has been saved',
      });

      setCurrentStep(3); // Go to review step
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

  const handleFileUpload = async (file: File, fieldLabel: string) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'File must be less than 5MB',
      });
      return null;
    }

    // Return the file to be stored in profileData
    return file;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // First, upload any file fields
      const dataToSubmit = { ...profileData };
      
      for (const field of formFields) {
        if (field.field_type === 'file' && profileData[field.label] instanceof File) {
          try {
            const response = await partnerKycService.uploadDocument(
              profileData[field.label],
              field.label
            );
            // Replace File object with uploaded document info
            dataToSubmit[field.label] = response.data.file_url;
          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: 'Upload failed',
              description: `Failed to upload ${field.label}: ${error.response?.data?.message || 'Please try again'}`,
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Save the complete profile with file URLs
      await partnerKycService.saveProfile({
        business_category: selectedCategory,
        data: dataToSubmit,
      });

      // Submit for review
      await partnerKycService.submitProfile();
      
      // Update the user's KYC status in context
      updateKycStatus('pending_review', false);
      
      toast({
        title: 'KYC submitted',
        description: 'Your KYC application has been submitted for review',
      });
      navigate('/partner-kyc-pending');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = profileData[field.label] || '';
    const error = profileErrors[field.label];

    const handleChange = (newValue: any) => {
      setProfileData({ ...profileData, [field.label]: newValue });
      setProfileErrors({ ...profileErrors, [field.label]: '' });
    };

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={`field-${field.id}`}>
          {field.label}
          {field.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {field.field_type === 'text' && (
          <Input
            id={`field-${field.id}`}
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'email' && (
          <Input
            id={`field-${field.id}`}
            type="email"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'number' && (
          <Input
            id={`field-${field.id}`}
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'date' && (
          <Input
            id={`field-${field.id}`}
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'textarea' && (
          <Textarea
            id={`field-${field.id}`}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'border-destructive' : ''}
            rows={4}
          />
        )}

        {field.field_type === 'select' && (
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.field_type === 'checkbox' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`field-${field.id}`}
              checked={value === true || value === 'true'}
              onCheckedChange={handleChange}
            />
            <Label htmlFor={`field-${field.id}`} className="font-normal cursor-pointer">
              I agree
            </Label>
          </div>
        )}

        {field.field_type === 'file' && (
          <div className="space-y-2">
            <input
              type="file"
              id={`field-${field.id}`}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const result = await handleFileUpload(file, field.label);
                  if (result) {
                    handleChange(result);
                  }
                }
              }}
            />
            {value instanceof File ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1">{value.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleChange(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : value ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-success/10">
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm">Document uploaded</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(`field-${field.id}`)?.click()}
                className={error ? 'border-destructive' : ''}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, JPEG, PNG. Maximum size: 5MB
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-semibold">Partner KYC Onboarding</h1>
                <p className="text-sm text-muted-foreground">Complete your verification</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors',
                      currentStep > step.id
                        ? 'border-brand bg-brand text-white'
                        : currentStep === step.id
                        ? 'border-brand bg-white text-brand'
                        : 'border-gray-300 bg-white text-gray-400'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-16 mx-2 transition-colors',
                      currentStep > step.id ? 'bg-brand' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Category Selection */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Your Business Category</CardTitle>
                <CardDescription>
                  Choose the category that best describes your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category) => (
                  <Card
                    key={category.id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-brand',
                      selectedCategory === category.slug && 'border-brand bg-brand/5'
                    )}
                    onClick={() => handleCategorySelect(category.slug)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        </div>
                        {selectedCategory === category.slug && (
                          <Check className="h-5 w-5 text-brand flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNextFromCategory} disabled={!selectedCategory}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Profile Form */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  Fill in the required information for your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {formFields.map((field) => renderField(field))}
                </div>

                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review and Submit */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Submission</CardTitle>
                <CardDescription>
                  Review your information before submitting for approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <h3 className="font-semibold mb-2">Business Category</h3>
                    <Badge variant="outline">
                      {categories.find((c) => c.slug === selectedCategory)?.name}
                    </Badge>
                  </div>

                  {/* Profile Data */}
                  <div>
                    <h3 className="font-semibold mb-3">Profile Information</h3>
                    <div className="space-y-2 rounded-lg border p-4">
                      {Object.entries(profileData).map(([key, value]) => {
                        // Skip displaying File objects in review
                        if (value instanceof File) {
                          return (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium flex items-center gap-2">
                                <Check className="h-3 w-3 text-success" />
                                {value.name}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      By submitting this application, you confirm that all information
                      provided is accurate and complete. Your application will be reviewed
                      by our team.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit for Review
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
