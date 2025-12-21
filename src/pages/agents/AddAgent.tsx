import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

export default function AddAgent() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Agent created successfully',
      description: `${formData.businessName} has been added to your agents.`,
    });

    // Navigate to agent details (mock ID)
    navigate('/agents/new-agent-123');
    setIsSubmitting(false);
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Add Agent"
        description="Create a new terminal agent for your partner."
        actions={
          <Button variant="ghost" onClick={() => navigate('/agents')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FormSection title="Business Information" description="Enter the agent's business details.">
                <FormField label="Business Name" required error={errors.businessName}>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Enter business name"
                  />
                </FormField>

                <FormField label="Business Address">
                  <Input
                    value={formData.businessAddress}
                    onChange={(e) => updateField('businessAddress', e.target.value)}
                    placeholder="Enter business address"
                  />
                </FormField>

                <FormField label="Business Phone" required error={errors.businessPhone}>
                  <Input
                    value={formData.businessPhone}
                    onChange={(e) => updateField('businessPhone', e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSection title="Contact Person" description="Primary contact for this agent.">
                <FormField label="Contact Name" required error={errors.contactName}>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => updateField('contactName', e.target.value)}
                    placeholder="Enter contact name"
                  />
                </FormField>

                <FormField label="Contact Email" required error={errors.contactEmail}>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="email@example.com"
                  />
                </FormField>

                <FormField label="Contact Phone" required error={errors.contactPhone}>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
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
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/agents')}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
