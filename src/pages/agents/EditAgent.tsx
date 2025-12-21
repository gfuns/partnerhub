import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}

interface FormErrors {
  businessName?: string;
  businessPhone?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Mock agent data
const mockAgent: FormData = {
  businessName: 'ABC Enterprises',
  businessAddress: '123 Main Street, Lagos',
  businessPhone: '+234 801 234 5678',
  contactName: 'John Doe',
  contactEmail: 'john@abcent.com',
  contactPhone: '+234 802 345 6789',
  isActive: true,
};

export default function EditAgent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Simulate fetching agent data
    const fetchAgent = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFormData(mockAgent);
      setIsLoading(false);
    };
    fetchAgent();
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!formData.businessPhone.trim()) {
      newErrors.businessPhone = 'Business phone is required';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Agent updated successfully',
      description: `${formData.businessName} has been updated.`,
    });

    navigate(`/agents/${id}`);
    setIsSubmitting(false);
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Edit Agent"
          description="Update agent information."
          actions={
            <Button variant="ghost" onClick={() => navigate('/agents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          }
        />
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Agent"
        description={`Update information for ${formData.businessName}.`}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/agents/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FormSection title="Business Information">
                <FormField label="Business Name" required error={errors.businessName}>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                  />
                </FormField>

                <FormField label="Business Address">
                  <Input
                    value={formData.businessAddress}
                    onChange={(e) => updateField('businessAddress', e.target.value)}
                  />
                </FormField>

                <FormField label="Business Phone" required error={errors.businessPhone}>
                  <Input
                    value={formData.businessPhone}
                    onChange={(e) => updateField('businessPhone', e.target.value)}
                  />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSection title="Contact Person">
                <FormField label="Contact Name" required error={errors.contactName}>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                  />
                </FormField>

                <FormField label="Contact Email" required error={errors.contactEmail}>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                  />
                </FormField>

                <FormField label="Contact Phone" required error={errors.contactPhone}>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                  />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSection title="Status">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable this agent to process transactions
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => updateField('isActive', checked)}
                  />
                </div>
              </FormSection>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/agents/${id}`)}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
