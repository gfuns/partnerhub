import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FormSection } from '@/components/FormSection';
import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useBranding } from '@/contexts/BrandingContext';
import brandingService from '@/services/api/branding.service';
import agentsService from '@/services/api/agents.service';

interface FormData {
    business_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    lga: string;
    owner_first_name: string;
    owner_last_name: string;
    owner_email: string;
    owner_phone: string;
}

interface FormErrors {
    business_name?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    lga?: string;
    owner_first_name?: string;
    owner_last_name?: string;
    owner_email?: string;
    owner_phone?: string;
}

export default function OnboardMerchant() {
    const navigate = useNavigate();
    const { setBranding, getAssetUrl, branding } = useBranding();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingBrand, setLoadingBrand] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [banks, setBanks] = useState<Array<{ id: number; name: string; code: string }>>([]);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [formData, setFormData] = useState<FormData>({
        business_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        state: '',
        lga: '',
        owner_first_name: '',
        owner_last_name: '',
        owner_email: '',
        owner_phone: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.business_name?.trim()) {
            newErrors.business_name = 'Business name is required';
        }
        if (!formData.contact_name?.trim()) {
            newErrors.contact_name = 'Contact name is required';
        }
        if (!formData.contact_email?.trim()) {
            newErrors.contact_email = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = 'Invalid email format';
        }
        if (!formData.contact_phone?.trim()) {
            newErrors.contact_phone = 'Contact phone is required';
        }
        if (!formData.address?.trim()) {
            newErrors.address = 'Address is required';
        }
        if (!formData.city?.trim()) {
            newErrors.city = 'City is required';
        }
        if (!formData.state?.trim()) {
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
            // For now, just log the payload
            console.log('Merchant Onboarding Payload:', formData);
            // TODO: Call API when endpoint is provided
        } finally {
            setIsSubmitting(false);
        }
    };

    // Extract subdomain (first segment) or use `partner` query param if present
    const detectSubdomain = (): string | null => {
        try {
            const url = new URL(window.location.href);
            const partnerParam = url.searchParams.get('partner');
            if (partnerParam) return partnerParam;
            const host = window.location.hostname; // e.g. partner.example.com
            const parts = host.split('.');
            if (parts.length > 2) return parts[0];
            return null;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        // Load partner branding if available
        const sub = detectSubdomain();
        if (!sub) return;
        setLoadingBrand(true);
        brandingService.getBrandingBySubdomain(sub)
            .then((res) => {
                if (res && res.data) {
                    setBranding(res.data);
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => setLoadingBrand(false));

        // Load list of banks for account verification
        agentsService.getBanks().then((b) => {
            if (b && b.data) setBanks(b.data);
        }).catch(() => { });
    }, []);

    const handleVerifyAccount = async () => {
        if (!accountNumber || !bankCode) return;
        setVerifyLoading(true);
        try {
            const resp = await agentsService.verifyAccount({ account_number: accountNumber, bank_code: bankCode });
            if (resp && resp.data) {
                // Auto-fill contact name with account name returned by bank
                updateField('contact_name', resp.data.accountName || '');
            }
        } catch (err) {
            // ignore — could show toast later
        } finally {
            setVerifyLoading(false);
        }
    };

    const updateField = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div>
            <PageHeader
                title="Onboard Merchant"
                description="Create a new terminal merchant for your partner."
                actions={
                    <Button variant="ghost" onClick={() => navigate('/')}> {/* Go home or landing */}
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                }
            />
            <form onSubmit={handleSubmit}>
                <div className="max-w-2xl space-y-6">
                    <Card>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="mb-2">Merchant Type</Label>
                                    <div className="flex gap-3">
                                        <Button variant={isReturning ? 'outline' : 'default'} onClick={() => setIsReturning(false)}>New Merchant</Button>
                                        <Button variant={isReturning ? 'default' : 'outline'} onClick={() => setIsReturning(true)}>Returning Merchant</Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {branding?.logo_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={getAssetUrl(branding.logo_url) || ''} alt="Partner logo" className="h-10 object-contain" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isReturning && (
                        <Card>
                            <CardContent>
                                <FormSection title="Returning Merchant" description="Lookup merchant details by bank account.">
                                    <div className="grid grid-cols-3 gap-4 items-end">
                                        <div>
                                            <FormField label="Bank">
                                                <Select value={bankCode} onValueChange={(v) => setBankCode(v)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select bank" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {banks.map((b) => (
                                                            <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                        </div>
                                        <FormField label="Account Number">
                                            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter account number" />
                                        </FormField>
                                        <div>
                                            <Button onClick={handleVerifyAccount} disabled={verifyLoading || !accountNumber || !bankCode}>
                                                {verifyLoading ? 'Verifying...' : 'Verify'}
                                            </Button>
                                        </div>
                                    </div>
                                </FormSection>
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardContent className="pt-6">
                            <FormSection title="Business Information" description="Enter the merchant's business details.">
                                <FormField label="Business Name" required error={errors.business_name}>
                                    <Input
                                        value={formData.business_name}
                                        onChange={(e) => updateField('business_name', e.target.value)}
                                        placeholder="Enter business name"
                                    />
                                </FormField>
                                <FormField label="Contact Name" required error={errors.contact_name}>
                                    <Input
                                        value={formData.contact_name}
                                        onChange={(e) => updateField('contact_name', e.target.value)}
                                        placeholder="Enter contact person name"
                                    />
                                </FormField>
                                <FormField label="Contact Email" required error={errors.contact_email}>
                                    <Input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => updateField('contact_email', e.target.value)}
                                        placeholder="contact@example.com"
                                    />
                                </FormField>
                                <FormField label="Contact Phone" required error={errors.contact_phone}>
                                    <Input
                                        value={formData.contact_phone}
                                        onChange={(e) => updateField('contact_phone', e.target.value)}
                                        placeholder="+234 XXX XXX XXXX"
                                    />
                                </FormField>
                                <FormField label="Business Address" required error={errors.address}>
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
                                        <Select
                                            value={formData.state}
                                            onValueChange={(v) => updateField('state', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
                                                    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
                                                    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
                                                    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
                                                ].map((state) => (
                                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                </div>
                                <FormField label="LGA" error={errors.lga}>
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
                            <FormSection title="Owner Information (Optional)" description="Additional owner details. If not provided, contact information will be used.">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="First Name" error={errors.owner_first_name}>
                                        <Input
                                            value={formData.owner_first_name}
                                            onChange={(e) => updateField('owner_first_name', e.target.value)}
                                            placeholder="Enter first name (optional)"
                                        />
                                    </FormField>
                                    <FormField label="Last Name" error={errors.owner_last_name}>
                                        <Input
                                            value={formData.owner_last_name}
                                            onChange={(e) => updateField('owner_last_name', e.target.value)}
                                            placeholder="Enter last name (optional)"
                                        />
                                    </FormField>
                                </div>
                                <FormField label="Owner Email" error={errors.owner_email}>
                                    <Input
                                        type="email"
                                        value={formData.owner_email}
                                        onChange={(e) => updateField('owner_email', e.target.value)}
                                        placeholder="owner@example.com (optional)"
                                    />
                                </FormField>
                                <FormField label="Owner Phone" error={errors.owner_phone}>
                                    <Input
                                        value={formData.owner_phone}
                                        onChange={(e) => updateField('owner_phone', e.target.value)}
                                        placeholder="+234 XXX XXX XXXX (optional)"
                                    />
                                </FormField>
                            </FormSection>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <FormSection title="KYC Status">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Pending Onboarding</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Merchant will need to complete KYC before accessing their dashboard
                                        </p>
                                    </div>
                                </div>
                            </FormSection>
                        </CardContent>
                    </Card>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Onboard Merchant'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancel</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
