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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const roles = [
  { id: 'admin', name: 'Admin', description: 'Full access to all features' },
  { id: 'manager', name: 'Manager', description: 'Manage agents and terminals' },
  { id: 'support', name: 'Support', description: 'View-only access with support capabilities' },
  { id: 'analyst', name: 'Analyst', description: 'Reports and analytics access' },
];

export default function CreateUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', role: '', isActive: true });
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; role?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: 'User invited successfully', description: `An invitation has been sent to ${formData.email}.` });
    navigate('/users');
    setIsSubmitting(false);
  };

  return (
    <div>
      <PageHeader title="Add User" description="Invite a new user to your partner organization." actions={<Button variant="ghost" onClick={() => navigate('/users')}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>} />

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <FormSection title="User Information">
                <FormField label="Full Name" required error={errors.fullName}>
                  <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Enter full name" />
                </FormField>
                <FormField label="Email" required error={errors.email}>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" />
                </FormField>
                <FormField label="Role" required error={errors.role}>
                  <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div><span className="font-medium">{role.name}</span><span className="text-muted-foreground ml-2">- {role.description}</span></div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormSection title="Status">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label>Active</Label><p className="text-sm text-muted-foreground">User can access the platform immediately</p></div>
                  <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData(prev => ({ ...prev, isActive: c }))} />
                </div>
              </FormSection>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Invitation'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
