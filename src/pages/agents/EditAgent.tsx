import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { agentsService, Agent, UpdateAgentRequest } from '@/services/api/agents.service';

interface FormData {
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  lga: string;
}

interface FormErrors {
  business_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
}

export default function EditAgent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    business_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    lga: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (id) {
      fetchAgent();
    }
  }, [id]);

  const fetchAgent = async () => {
    try {
      setIsLoading(true);
      const response = await agentsService.getAgent(Number(id));
      const agent = response.data.agent;
      
      setFormData({
        business_name: agent.business_name,
        contact_name: agent.contact_name,
        contact_email: agent.contact_email,
        contact_phone: agent.contact_phone,
        address: agent.address,
        city: agent.city,
        state: agent.state,
        lga: agent.lga || '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load agent details',
        variant: 'destructive',
      });
      navigate('/agents');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Contact name is required';
    }
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }
    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'Contact phone is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const updateData: UpdateAgentRequest = {
        business_name: formData.business_name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        lga: formData.lga || undefined,
      };

      await agentsService.updateAgent(Number(id), updateData);

      toast({
        title: 'Success',
        description: 'Agent updated successfully',
      });

      navigate(`/agents/${id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update agent',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
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
        description={`Update information for ${formData.business_name}.`}
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
                <FormField label="Business Name" required error={errors.business_name}>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => updateField('business_name', e.target.value)}
                    placeholder="Enter business name"
                  />
                </FormField>

                <FormField label="Address" required error={errors.address}>
                  <Input
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Enter business address"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="City" required error={errors.city}>
                    <Input
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </FormField>

                  <FormField label="State" required error={errors.state}>
                    <Input
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </FormField>
                </div>

                <FormField label="LGA (Local Government Area)">
                  <Input
                    value={formData.lga}
                    onChange={(e) => updateField('lga', e.target.value)}
                    placeholder="Enter LGA (optional)"
                  />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSection title="Contact Information" description="">
                <FormField label="Contact Name" required>
                  <Input
                    value={formData.contact_name}
                  />
                </FormField>

                <FormField label="Contact Email" required>
                  <Input
                    type="email"
                    value={formData.contact_email}
                  />
                </FormField>

                <FormField label="Contact Phone" required>
                  <Input
                    value={formData.contact_phone}
                  />
                </FormField>
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
