/**
 * Public Merchant Onboarding Page
 * - No auth required (not guarded by DashboardLayout)
 * - Loads partner branding from subdomain on mount
 * - Step 0: Existing or New merchant?
 *   - Existing: bank account lookup → pre-fill form
 *   - New: full form
 * - Step 1: Business / Contact Info (Agent creation fields)
 * - Step 2: KYC Profile (identity + bank details)
 * - Step 3: Document Upload (dynamic per business type)
 * - Step 4: Review & Submit
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Upload, User, Briefcase, FileText, ArrowRight, ArrowLeft, Loader2, X, Building2, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useBranding } from '@/contexts/BrandingContext';
import brandingService from '@/services/api/branding.service';
import publicService from '@/services/api/public.service';
import {
  BUSINESS_TYPE_OPTIONS,
  ID_TYPE_OPTIONS,
  GENDER_OPTIONS,
} from '@/types/kyc';
import type {
  BusinessType,
  DocumentType,
  RequiredDocument,
  KycDocument,
  DocumentStatus,
} from '@/types/kyc';
import { toast as sonnerToast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const STEPS = [
  { id: 1, title: 'Business Info', description: 'Business & contact details' },
  { id: 2, title: 'KYC Profile', description: 'Identity & bank details' },
  { id: 3, title: 'Documents', description: 'Upload required documents' },
  { id: 4, title: 'Review', description: 'Review & submit' },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface BusinessFormData {
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

interface KycFormData {
  business_type: BusinessType | '';
  id_type: string;
  id_number: string;
  date_of_birth: string;
  gender: string;
  rc_number: string;
  tin_number: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  bvn: string;
}

interface UploadedDoc {
  document_type: string;
  file: File;
  status: 'pending';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectSubdomain(): string {
  try {
    const url = new URL(window.location.href);
    const partnerParam = url.searchParams.get('partner');
    if (partnerParam) return partnerParam;
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 2) return parts[0];
    return '';
  } catch {
    return '';
  }
}

function getRequiredDocs(businessType: BusinessType): RequiredDocument[] {
  const base: RequiredDocument[] = [
    { type: 'valid_id', label: 'Valid Government ID', required: true, max_size_kb: 5120, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] },
    { type: 'passport_photo', label: 'Passport Photograph', required: true, max_size_kb: 2048, allowed_types: ['image/jpeg', 'image/png'] },
    { type: 'utility_bill', label: 'Utility Bill (Proof of Address)', required: true, max_size_kb: 5120, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] },
  ];
  if (businessType === 'sme') {
    base.push({ type: 'cac_certificate', label: 'CAC Certificate', required: true, max_size_kb: 5120, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] });
  }
  if (businessType === 'corporate') {
    base.push(
      { type: 'cac_certificate', label: 'CAC Certificate', required: true, max_size_kb: 5120, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] },
      { type: 'cac_form_co7', label: 'CAC Form CO7', required: true, max_size_kb: 5120, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] },
      { type: 'memorandum', label: 'Memorandum & Articles', required: false, max_size_kb: 10240, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] },
      { type: 'director_id', label: "Director's ID", required: true, max_size_kb: 5120, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] },
    );
  }
  return base;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OnboardMerchant() {
  const navigate = useNavigate();
  const { setBranding, getAssetUrl } = useBranding();

  // Branding state
  const [remoteBranding, setRemoteBranding] = useState<any>(null);
  const [remotePartner, setRemotePartner] = useState<any>(null);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const subdomain = detectSubdomain();

  // Flow state
  const [isReturning, setIsReturning] = useState<boolean | null>(null); // null = not decided yet
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lookup state
  const [banks, setBanks] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [lookupAccountNumber, setLookupAccountNumber] = useState('');
  const [lookupBankCode, setLookupBankCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [accountVerifyLoading, setAccountVerifyLoading] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);

  // Form data
  const [businessForm, setBusinessForm] = useState<BusinessFormData>({
    business_name: '', contact_name: '', contact_email: '', contact_phone: '',
    address: '', city: '', state: '', lga: '',
    owner_first_name: '', owner_last_name: '', owner_email: '', owner_phone: '',
  });
  const [kycForm, setKycForm] = useState<KycFormData>({
    business_type: '', id_type: '', id_number: '', date_of_birth: '', gender: '',
    rc_number: '', tin_number: '', bank_name: '', bank_code: '', account_number: '',
    account_name: '', bvn: '',
  });
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  // Errors
  const [businessErrors, setBusinessErrors] = useState<Partial<Record<keyof BusinessFormData, string>>>({});
  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});

  // Load branding + banks
  useEffect(() => {
    const sub = subdomain;
    setLoadingBrand(true);
    brandingService.getBrandingBySubdomain(sub || 'default')
      .then((res) => {
        if (res?.success && res.data) {
          const payload = res.data.branding ?? res.data;
          if (res.data.partner) setRemotePartner(res.data.partner);
          setRemoteBranding(payload);
          setBranding(payload as any);
        }
      })
      .catch(() => { /* silently ignore */ })
      .finally(() => setLoadingBrand(false));

    // Load banks (try public endpoint first)
    publicService.getBanks(subdomain)
      .then((r) => { if (r?.data) setBanks(r.data); })
      .catch(() => {
        // fallback to authenticated endpoint if needed
      });
  }, []);

  // ── Lookup handlers ──────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!lookupAccountNumber || !lookupBankCode) return;
    setVerifyLoading(true);
    try {
      const resp = await publicService.verifyAccount({ account_number: lookupAccountNumber, bank_code: lookupBankCode, subdomain: subdomain });
      if (resp?.success && resp?.data) {
        const bank = banks.find(b => b.code === lookupBankCode);
        setBusinessForm(prev => ({
          ...prev,
          contact_name: `${resp?.data?.first_name} ${resp?.data?.last_name}` || prev.contact_name,
          contact_phone: resp?.data?.mobile || '',
          contact_email: resp?.data?.email || '',
          owner_first_name: resp?.data?.first_name || '',
          owner_last_name: resp?.data?.last_name || '',
          owner_email: resp?.data?.email || '',
          owner_phone: resp?.data?.mobile || '',
        }));
        setKycForm(prev => ({
          ...prev,
          account_number: lookupAccountNumber,
          account_name: resp.data.accountName || `${resp?.data?.first_name} ${resp?.data?.last_name}` || '',
          bank_name: bank?.name || '',
          bank_code: lookupBankCode,
          bvn: resp.data.bvn || prev.bvn,
        }));
        setLookupDone(true);
        sonnerToast.success('Account verified', { description: `Account holder: ${resp.data.accountName}` });
      } else {
        sonnerToast.error('Could not verify account', { description: resp?.message || 'Please check the account number and bank selected.' });
      }
    } catch {
      sonnerToast.error('Could not verify account', { description: 'Please check the account number and bank selected.' });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Auto-verify account when account number reaches 10 digits and bank_code is selected
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const acct = kycForm.account_number || '';
    const bank = kycForm.bank_code || '';

    // Clear verification when incomplete
    if (acct.length < 10 || !bank) {
      setAccountVerified(false);
      // remove any previous account_number error
      setKycErrors(prev => {
        const copy = { ...prev };
        delete copy.account_number;
        return copy;
      });
      return;
    }

    // debounce to avoid repeated calls while typing
    timer = setTimeout(async () => {
      setAccountVerifyLoading(true);
      try {
        const resp = await publicService.verifyAccount({ account_number: acct, bank_code: bank, subdomain });
        if (resp?.success && resp?.data) {
          setKycForm(prev => ({
            ...prev,
            account_name: resp.data.accountName || resp.data.account_name || prev.account_name,
            bvn: resp.data.bvn || prev.bvn,
          }));

          setBusinessForm(prev => ({
            ...prev,
            contact_name: resp?.data?.first_name ? `${resp.data.first_name} ${resp.data.last_name}` : prev.contact_name,
            contact_phone: resp?.data?.mobile || prev.contact_phone,
            contact_email: resp?.data?.email || prev.contact_email,
          }));

          setAccountVerified(true);
          setKycErrors(prev => {
            const copy = { ...prev };
            delete copy.account_number;
            return copy;
          });
          sonnerToast.success('Account verified', { description: `Account holder: ${resp.data.accountName}` });
        } else {
          setAccountVerified(false);
          setKycErrors(prev => ({ ...prev, account_number: resp?.message || 'Could not verify account' }));
        }
      } catch (err) {
        setAccountVerified(false);
        setKycErrors(prev => ({ ...prev, account_number: 'Could not verify account' }));
      } finally {
        setAccountVerifyLoading(false);
      }
    }, 600);

    return () => { if (timer) clearTimeout(timer); };
  }, [kycForm.account_number, kycForm.bank_code, subdomain]);

  // ── Validation ───────────────────────────────────────────────────────────
  const validateBusiness = (): boolean => {
    const errs: typeof businessErrors = {};
    if (!businessForm.business_name.trim()) errs.business_name = 'Business name is required';
    if (!businessForm.contact_name.trim()) errs.contact_name = 'Contact name is required';
    if (!businessForm.contact_email.trim()) errs.contact_email = 'Contact email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessForm.contact_email)) errs.contact_email = 'Invalid email format';
    if (!businessForm.contact_phone.trim()) errs.contact_phone = 'Contact phone is required';
    if (!businessForm.address.trim()) errs.address = 'Address is required';
    if (!businessForm.city.trim()) errs.city = 'City is required';
    if (!businessForm.state.trim()) errs.state = 'State is required';
    setBusinessErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateKyc = (): boolean => {
    const errs: Record<string, string> = {};
    if (!kycForm.business_type) errs.business_type = 'Business type is required';
    if (!kycForm.id_type) errs.id_type = 'ID type is required';
    if (!kycForm.id_number.trim()) errs.id_number = 'ID number is required';
    if (kycForm.business_type === 'individual') {
      if (!kycForm.date_of_birth) errs.date_of_birth = 'Date of birth is required';
      if (!kycForm.gender) errs.gender = 'Gender is required';
    }
    if ((kycForm.business_type === 'sme' || kycForm.business_type === 'corporate') && !kycForm.rc_number.trim()) {
      errs.rc_number = 'RC number is required for SME/Corporate';
    }
    if (!kycForm.bank_name.trim()) errs.bank_name = 'Bank name is required';
    if (!kycForm.account_number.trim()) errs.account_number = 'Account number is required';
    else if (kycForm.account_number.length !== 10) errs.account_number = 'Account number must be 10 digits';
    if (!kycForm.account_name.trim()) errs.account_name = 'Account name is required';
    if (!kycForm.bvn.trim()) errs.bvn = 'BVN is required';
    else if (kycForm.bvn.length !== 11) errs.bvn = 'BVN must be 11 digits';
    setKycErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 1 && !validateBusiness()) return;
    if (currentStep === 2 && !validateKyc()) return;
    setCurrentStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      // Go back to the New / Existing merchant choice screen
      setIsReturning(null);
      window.scrollTo(0, 0);
      return;
    }
    setCurrentStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateBusiness() || !validateKyc()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...businessForm,
        business_type: kycForm.business_type as string,
        id_type: kycForm.id_type,
        id_number: kycForm.id_number,
        date_of_birth: kycForm.date_of_birth || undefined,
        gender: kycForm.gender || undefined,
        rc_number: kycForm.rc_number || undefined,
        tin_number: kycForm.tin_number || undefined,
        bank_name: kycForm.bank_name,
        bank_code: kycForm.bank_code || undefined,
        account_number: kycForm.account_number,
        account_name: kycForm.account_name,
        bvn: kycForm.bvn,
        partner_subdomain: subdomain || undefined,
      };

      let resp: any;

      if (uploadedDocs.length > 0) {
        // Send as multipart/form-data including files so backend can process them in one request
        const form = new FormData();
        // Append scalar fields
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) form.append(k, String(v));
        });

        // Append documents as documents[i][document_type], documents[i][file]
        uploadedDocs.forEach((d, i) => {
          form.append(`documents[${i}][document_type]`, d.document_type);
          form.append(`documents[${i}][file]`, d.file);
        });

        resp = await publicService.onboardMerchant(form);
      } else {
        resp = await publicService.onboardMerchant(payload);
      }

      // If backend returned a kyc_token and we still have files (fallback), upload them individually
      if (resp?.data?.kyc_token && uploadedDocs.length > 0) {
        for (const doc of uploadedDocs) {
          try {
            await publicService.uploadKycDocument(resp.data.kyc_token, doc.document_type, doc.file);
          } catch {
            // best-effort upload; merchant can re-upload later via KYC flow
          }
        }
      }

      setSubmitSuccess(true);
      sonnerToast.success('Application submitted!', {
        description: 'You will receive an email with your login credentials to complete KYC.',
      });
    } catch (err: any) {
      const apiErrors = err?.errors;
      if (apiErrors) {
        setBusinessErrors(apiErrors);
        setKycErrors(apiErrors);
      }
      sonnerToast.error('Submission failed', {
        description: err?.message || 'Please review your details and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived branding values ───────────────────────────────────────────────
  const activeBranding = remoteBranding || {};
  const logoUrl = getAssetUrl(remotePartner?.logo_url ?? activeBranding.logo_url);
  const partnerName = remotePartner?.name ?? activeBranding.partner_name ?? 'Merchant Portal';

  // ── Render: loading branding ──────────────────────────────────────────────
  if (loadingBrand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render: success ───────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: activeBranding.body_bg_color || undefined, fontFamily: activeBranding.font_family || undefined }}
      >
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-5xl">
            {logoUrl ? (
              <img src={logoUrl} alt={partnerName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-lg bg-brand p-1.5">
                  <CreditCard className="h-5 w-5 text-brand-foreground" />
                </div>
                <span className="text-xl font-semibold">{partnerName}</span>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Application Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Your merchant application has been submitted successfully. You will receive an email shortly with your login credentials to complete the KYC verification process.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Once your KYC is approved by the partner, you'll be able to access your merchant dashboard and start processing payments.
            </p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: choose type (step 0) ──────────────────────────────────────────
  if (isReturning === null) {
    return (
      <OnboardLayout activeBranding={activeBranding} logoUrl={logoUrl} partnerName={partnerName}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Merchant Onboarding</h1>
            <p className="text-muted-foreground text-lg">Get started with your merchant account today</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setIsReturning(false)}
              className="p-8 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all group"
              style={{ borderColor: undefined }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <User className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">New Merchant</h3>
              <p className="text-sm text-muted-foreground">
                First time? Register your business and complete KYC verification to start accepting payments.
              </p>
            </button>

            <button
              onClick={() => setIsReturning(true)}
              className="p-8 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Existing Merchant</h3>
              <p className="text-sm text-muted-foreground">
                Already have a bank account with us? Look up your account to fast-track the registration process.
              </p>
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">
              Sign in here
            </button>
          </p>
        </div>
      </OnboardLayout>
    );
  }

  // ── Render: returning merchant lookup ─────────────────────────────────────
  if (isReturning && !lookupDone) {
    return (
      <OnboardLayout activeBranding={activeBranding} logoUrl={logoUrl} partnerName={partnerName}>
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <button onClick={() => setIsReturning(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-2xl font-bold mb-2">Account Lookup</h2>
            <p className="text-muted-foreground">Enter your bank account details to auto-fill your registration form.</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Bank <span className="text-destructive">*</span></Label>
                <Select value={lookupBankCode} onValueChange={setLookupBankCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(b => (
                      <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Number <span className="text-destructive">*</span></Label>
                <Input
                  value={lookupAccountNumber}
                  onChange={(e) => setLookupAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit account number"
                  inputMode="numeric"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={verifyLoading || !lookupAccountNumber || !lookupBankCode || lookupAccountNumber.length !== 10}
                style={{
                  background: activeBranding.btn_primary_bg_color || undefined,
                  color: activeBranding.btn_primary_text_color || undefined,
                }}
              >
                {verifyLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : 'Verify Account'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Not an existing merchant?{' '}
                <button onClick={() => { setIsReturning(false); }} className="text-primary hover:underline">
                  Register as new
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </OnboardLayout>
    );
  }

  // ── Render: multi-step form ───────────────────────────────────────────────
  const requiredDocs = kycForm.business_type ? getRequiredDocs(kycForm.business_type as BusinessType) : [];

  return (
    <OnboardLayout activeBranding={activeBranding} logoUrl={logoUrl} partnerName={partnerName}>
      <div className="max-w-3xl mx-auto">
        {/* Step progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all',
                    currentStep > step.id ? 'bg-primary text-primary-foreground' :
                      currentStep === step.id ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                        'bg-muted text-muted-foreground'
                  )}>
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={cn('text-xs font-medium hidden sm:block', currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground')}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 mx-2 transition-colors', currentStep > step.id ? 'bg-primary' : 'bg-muted')} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <BusinessInfoStep
            form={businessForm}
            errors={businessErrors}
            onChange={(field, value) => {
              setBusinessForm(prev => ({ ...prev, [field]: value }));
              if (businessErrors[field]) setBusinessErrors(prev => ({ ...prev, [field]: undefined }));
            }}
            isReturning={!!isReturning}
            onBack={() => setIsReturning(null)}
          />
        )}

        {/* Step 2: KYC Profile */}
        {currentStep === 2 && (
          <KycProfileStep
            form={kycForm}
            errors={kycErrors}
            banks={banks}
            subdomain={subdomain}
            isReturning={isReturning}
            onChange={(field, value) => {
              setKycForm(prev => ({ ...prev, [field]: value as any }));
              if (kycErrors[field]) setKycErrors(prev => ({ ...prev, [field]: undefined }));
            }}
          />
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <DocumentsStep
            businessType={kycForm.business_type as BusinessType | ''}
            requiredDocs={requiredDocs}
            uploadedDocs={uploadedDocs}
            onAddDoc={(doc) => setUploadedDocs(prev => {
              const existing = prev.findIndex(d => d.document_type === doc.document_type);
              if (existing >= 0) {
                const copy = [...prev];
                copy[existing] = doc;
                return copy;
              }
              return [...prev, doc];
            })}
            onRemoveDoc={(type) => setUploadedDocs(prev => prev.filter(d => d.document_type !== type))}
          />
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <ReviewStep
            businessForm={businessForm}
            kycForm={kycForm}
            uploadedDocs={uploadedDocs}
            requiredDocs={requiredDocs}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} style={{ background: activeBranding.btn_primary_bg_color || undefined, color: activeBranding.btn_primary_text_color || undefined }}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} style={{ background: activeBranding.btn_primary_bg_color || undefined, color: activeBranding.btn_primary_text_color || undefined }}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </OnboardLayout>
  );
}

// ─── Layout wrapper ──────────────────────────────────────────────────────────

function OnboardLayout({ activeBranding, logoUrl, partnerName, children }: {
  activeBranding: any;
  logoUrl: string | null;
  partnerName: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ background: activeBranding.body_bg_color || undefined, fontFamily: activeBranding.font_family || undefined }}
    >
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-10" style={{ background: activeBranding.header_bg_color || undefined }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-5xl">
          {logoUrl ? (
            <img src={logoUrl} alt={partnerName} className="h-10 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-brand p-1.5">
                <CreditCard className="h-5 w-5 text-brand-foreground" />
              </div>
              <span className="text-xl font-semibold" style={{ color: activeBranding.header_text_color || undefined }}>{partnerName}</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Merchant Onboarding
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        {children}
      </main>
    </div>
  );
}

// ─── Step 1: Business Info ────────────────────────────────────────────────────

function BusinessInfoStep({ form, errors, onChange, isReturning, onBack }: {
  form: BusinessFormData;
  errors: Partial<Record<keyof BusinessFormData, string>>;
  onChange: (field: keyof BusinessFormData, value: string) => void;
  isReturning: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      {isReturning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Some details have been pre-filled from your bank account. Please review and complete the remaining fields.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Enter your business details as they appear on official documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Business Name" required error={errors.business_name}>
            <Input value={form.business_name} onChange={e => onChange('business_name', e.target.value)} placeholder="e.g. Adeyemi Ventures" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Contact Name" required error={errors.contact_name}>
              <Input value={form.contact_name} onChange={e => onChange('contact_name', e.target.value)} placeholder="Contact person full name" />
            </Field>
            <Field label="Contact Phone" required error={errors.contact_phone}>
              <Input value={form.contact_phone} onChange={e => onChange('contact_phone', e.target.value)} placeholder="+234 XXX XXX XXXX" />
            </Field>
          </div>
          <Field label="Contact Email" required error={errors.contact_email}>
            <Input type="email" value={form.contact_email} onChange={e => onChange('contact_email', e.target.value)} placeholder="contact@yourbusiness.com" />
          </Field>
          <Field label="Business Address" required error={errors.address}>
            <Input value={form.address} onChange={e => onChange('address', e.target.value)} placeholder="Full business address" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="City" required error={errors.city}>
              <Input value={form.city} onChange={e => onChange('city', e.target.value)} placeholder="City" />
            </Field>
            <Field label="State" required error={errors.state}>
              <Select value={form.state} onValueChange={v => onChange('state', v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>{NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="LGA">
              <Input value={form.lga} onChange={e => onChange('lga', e.target.value)} placeholder="LGA (optional)" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Owner Information <span className="text-sm font-normal text-muted-foreground">(Optional)</span></CardTitle>
          <CardDescription>If different from the contact person above. If omitted, contact information will be used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name">
              <Input value={form.owner_first_name} onChange={e => onChange('owner_first_name', e.target.value)} placeholder="Owner first name" />
            </Field>
            <Field label="Last Name">
              <Input value={form.owner_last_name} onChange={e => onChange('owner_last_name', e.target.value)} placeholder="Owner last name" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Owner Email">
              <Input type="email" value={form.owner_email} onChange={e => onChange('owner_email', e.target.value)} placeholder="owner@email.com" />
            </Field>
            <Field label="Owner Phone">
              <Input value={form.owner_phone} onChange={e => onChange('owner_phone', e.target.value)} placeholder="+234 XXX XXX XXXX" />
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 2: KYC Profile ──────────────────────────────────────────────────────

function KycProfileStep({ form, errors, banks, subdomain, isReturning, onChange }: {
  form: KycFormData;
  errors: Record<string, string>;
  banks: Array<{ id: number; name: string; code: string }>;
  subdomain?: string | null;
  isReturning: boolean;
  onChange: (field: keyof KycFormData, value: string | BusinessType) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Business Type */}
      <Card>
        <CardHeader>
          <CardTitle>Business Classification</CardTitle>
          <CardDescription>Select the type that best describes your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {BUSINESS_TYPE_OPTIONS.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => onChange('business_type', type.value)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50',
                  form.business_type === type.value ? 'border-primary bg-primary/5' : 'border-border'
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
          {errors.business_type && <p className="text-sm text-destructive mt-2">{errors.business_type}</p>}
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader><CardTitle>Identity Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ID Type" required error={errors.id_type}>
              <Select value={form.id_type} onValueChange={v => onChange('id_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
                <SelectContent>{ID_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="ID Number" required error={errors.id_number}>
              <Input value={form.id_number} onChange={e => onChange('id_number', e.target.value)} placeholder="Enter ID number" />
            </Field>
          </div>

          {form.business_type === 'individual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date of Birth" required error={errors.date_of_birth}>
                <Input type="date" value={form.date_of_birth} onChange={e => onChange('date_of_birth', e.target.value)} />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <Select value={form.gender} onValueChange={v => onChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>{GENDER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {(form.business_type === 'sme' || form.business_type === 'corporate') && (
            <Field label="RC Number (CAC Registration)" required error={errors.rc_number}>
              <Input value={form.rc_number} onChange={e => onChange('rc_number', e.target.value)} placeholder="Enter CAC RC number" />
            </Field>
          )}

          <Field label="TIN Number (Optional)">
            <Input value={form.tin_number} onChange={e => onChange('tin_number', e.target.value)} placeholder="Tax Identification Number" />
          </Field>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
          <CardDescription>Funds will be settled to this account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Bank Name" required error={errors.bank_name}>
            {banks.length > 0 ? (
              <Select value={form.bank_code} disabled={subdomain?.toLowerCase() === 'page' && isReturning} onValueChange={v => {
                const bank = banks.find(b => b.code === v);
                onChange('bank_code', v);
                if (bank) onChange('bank_name', bank.name);
              }}>
                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>{banks.map(b => <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input value={form.bank_name} disabled={subdomain?.toLowerCase() === 'page' && isReturning} onChange={e => onChange('bank_name', e.target.value)} placeholder="e.g. First Bank" />
            )}
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account Number" required error={errors.account_number}>
              <Input
                value={form.account_number}
                onChange={e => onChange('account_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit account number"
                inputMode="numeric"
                disabled={subdomain?.toLowerCase() === 'page' && isReturning}
                maxLength={10}
              />
            </Field>
            <Field label="Account Name" required error={errors.account_name}>
              <Input value={form.account_name} disabled placeholder="Account holder name (auto-filled)" />
            </Field>
          </div>
          <Field label="BVN (Bank Verification Number)" required error={errors.bvn}>
            <Input
              value={form.bvn}
              onChange={e => onChange('bvn', e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="11-digit BVN"
              inputMode="numeric"
              disabled={subdomain?.toLowerCase() === 'page' && isReturning}
              maxLength={11}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 3: Documents ────────────────────────────────────────────────────────

function DocumentsStep({ businessType, requiredDocs, uploadedDocs, onAddDoc, onRemoveDoc }: {
  businessType: BusinessType | '';
  requiredDocs: RequiredDocument[];
  uploadedDocs: UploadedDoc[];
  onAddDoc: (doc: UploadedDoc) => void;
  onRemoveDoc: (type: string) => void;
}) {
  if (!businessType) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please go back and select a business type to see the required documents.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>Upload clear, legible copies of the following documents. You may also upload these after registration if not ready now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Accepted formats: JPEG, PNG, PDF. Maximum file size: 5MB per document.
            </AlertDescription>
          </Alert>
          {requiredDocs.map(doc => (
            <DocUploadCard
              key={doc.type}
              config={doc}
              uploaded={uploadedDocs.find(d => d.document_type === doc.type)}
              onUpload={(file) => onAddDoc({ document_type: doc.type, file, status: 'pending' })}
              onRemove={() => onRemoveDoc(doc.type)}
            />
          ))}
        </CardContent>
      </Card>

      {/* <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> You can still submit without uploading documents. You'll be able to upload them after registration via your KYC portal link sent to your email.
        </AlertDescription>
      </Alert> */}
    </div>
  );
}

function DocUploadCard({ config, uploaded, onUpload, onRemove }: {
  config: RequiredDocument;
  uploaded?: UploadedDoc;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > config.max_size_kb * 1024) {
      sonnerToast.error('File too large', { description: `Max size: ${config.max_size_kb / 1024}MB` });
      return;
    }
    onUpload(file);
  };

  const isUploaded = !!uploaded;

  return (
    <div className={cn('p-4 border-2 rounded-lg transition-colors', isUploaded ? 'border-primary/30 bg-primary/5' : 'border-border')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn('p-2 rounded-lg flex-shrink-0', isUploaded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            {isUploaded ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium">{config.label}</h4>
              {config.required && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Required</span>}
              {!config.required && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Optional</span>}
            </div>
            {isUploaded ? (
              <p className="text-sm text-primary mt-1">{uploaded!.file.name} ({(uploaded!.file.size / 1024).toFixed(0)} KB)</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">{config.allowed_types.join(', ')} • Max {config.max_size_kb / 1024}MB</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <input ref={fileRef} type="file" accept={config.allowed_types.join(',')} onChange={handleChange} className="hidden" />
          <Button variant={isUploaded ? 'outline' : 'default'} size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploaded ? 'Replace' : 'Upload'}
          </Button>
          {isUploaded && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function ReviewStep({ businessForm, kycForm, uploadedDocs, requiredDocs }: {
  businessForm: BusinessFormData;
  kycForm: KycFormData;
  uploadedDocs: UploadedDoc[];
  requiredDocs: RequiredDocument[];
}) {
  const businessTypeLabel = BUSINESS_TYPE_OPTIONS.find(o => o.value === kycForm.business_type)?.label ?? kycForm.business_type;
  const idTypeLabel = ID_TYPE_OPTIONS.find(o => o.value === kycForm.id_type)?.label ?? kycForm.id_type;
  const requiredDocCount = requiredDocs.filter(d => d.required).length;
  const uploadedRequiredCount = uploadedDocs.filter(d => requiredDocs.find(r => r.type === d.document_type && r.required)).length;

  return (
    <div className="space-y-6">
      <Alert className={uploadedRequiredCount < requiredDocCount ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50'}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {uploadedRequiredCount < requiredDocCount
            ? `${uploadedRequiredCount} of ${requiredDocCount} required documents uploaded. You can still submit and upload documents later.`
            : 'All required documents uploaded. You\'re ready to submit!'}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <ReviewRow label="Business Name" value={businessForm.business_name} />
          <ReviewRow label="Contact Name" value={businessForm.contact_name} />
          <ReviewRow label="Contact Email" value={businessForm.contact_email} />
          <ReviewRow label="Contact Phone" value={businessForm.contact_phone} />
          <ReviewRow label="Address" value={`${businessForm.address}, ${businessForm.city}, ${businessForm.state}`} />
          {businessForm.lga && <ReviewRow label="LGA" value={businessForm.lga} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>KYC Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <ReviewRow label="Business Type" value={businessTypeLabel} />
          <ReviewRow label="ID Type" value={idTypeLabel} />
          <ReviewRow label="ID Number" value={kycForm.id_number} />
          {kycForm.date_of_birth && <ReviewRow label="Date of Birth" value={kycForm.date_of_birth} />}
          {kycForm.gender && <ReviewRow label="Gender" value={kycForm.gender} />}
          {kycForm.rc_number && <ReviewRow label="RC Number" value={kycForm.rc_number} />}
          <ReviewRow label="Bank Name" value={kycForm.bank_name} />
          <ReviewRow label="Account Number" value={kycForm.account_number} />
          <ReviewRow label="Account Name" value={kycForm.account_name} />
          <ReviewRow label="BVN" value={`${kycForm.bvn.slice(0, 4)}${'*'.repeat(kycForm.bvn.length - 4)}`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documents ({uploadedDocs.length} uploaded)</CardTitle></CardHeader>
        <CardContent>
          {requiredDocs.map(doc => {
            const uploaded = uploadedDocs.find(d => d.document_type === doc.type);
            return (
              <div key={doc.type} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{doc.label} {doc.required && <span className="text-destructive">*</span>}</span>
                {uploaded ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Uploaded
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Pending</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        By submitting, you confirm that all information provided is accurate and you agree to our terms & conditions.
      </p>
    </div>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5 truncate">{value || '—'}</p>
    </div>
  );
}
