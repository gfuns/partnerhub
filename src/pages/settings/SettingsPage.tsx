import { useState, useEffect, useRef } from 'react';
import { Upload, Save, Key, Globe, Shield, Building2, Mail, Phone, MapPin, Users, Terminal, FileText, Loader2, RotateCcw, Lock, Palette, Image } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import settingsService, { 
  SettingsData, 
  PartnerProfile, 
  BrandingSettings,
  KycProfile,
  KycDocument,
  KycReview,
  PartnerStatistics
} from '@/services/api/settings.service';

export default function SettingsPage() {
  const { partner, getAssetUrl } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isResettingBranding, setIsResettingBranding] = useState(false);
  
  // Settings data
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [lockedFields, setLockedFields] = useState<string[]>([]);
  
  // Editable profile fields
  const [partnerName, setPartnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  
  // Branding fields
  const [branding, setBranding] = useState<Partial<BrandingSettings>>({});
  
  // File upload refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoDarkInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const loginBgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await settingsService.getSettings();
      setSettingsData(response.data);
      
      const profile = response.data.profile;
      // Populate editable fields
      setPartnerName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setCountry(profile.country || '');
      setDescription(profile.description || '');
      
      // Set branding
      setBranding(response.data.branding);
      
      // Determine locked fields if KYC is approved
      if (profile.is_kyc_approved) {
        setLockedFields(['name', 'email', 'phone', 'address', 'city', 'state', 'country']);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load settings',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await settingsService.updateProfile({
        name: partnerName,
        email,
        phone,
        address,
        city,
        state,
        country,
        description,
      });
      
      if (response.data?.locked_fields) {
        setLockedFields(response.data.locked_fields);
      }
      
      toast({
        title: 'Profile updated',
        description: response.message || 'Your profile has been updated successfully.',
      });
      // Reload settings to get latest data
      await loadSettings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      await settingsService.updateBranding(branding);
      toast({
        title: 'Branding saved',
        description: 'Your branding settings have been updated successfully.',
      });
      await loadSettings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleResetBranding = async () => {
    setIsResettingBranding(true);
    try {
      await settingsService.resetBranding();
      toast({
        title: 'Branding reset',
        description: 'Branding has been reset to defaults.',
      });
      await loadSettings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsResettingBranding(false);
    }
  };

  const handleImageUpload = async (type: 'logo' | 'logo_dark' | 'favicon' | 'login_bg_image', file: File) => {
    setIsUploadingImages(true);
    try {
      await settingsService.uploadBrandingImages({ [type]: file });
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully.',
      });
      await loadSettings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const isFieldLocked = (field: string) => lockedFields.includes(field);

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending_review':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const profile = settingsData?.profile;
  const statistics = settingsData?.statistics;
  const kycProfile = settingsData?.kyc_profile;
  const latestReview = settingsData?.latest_kyc_review;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your partner profile and platform settings."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          {/* <TabsTrigger value="api">API & Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger> */}
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Partner Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Partner Overview</CardTitle>
                <CardDescription>
                  Your partner account information and statistics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ) : profile ? (
                  <div className="space-y-6">
                    {/* Partner Identity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center border">
                          {profile.logo_url ? (
                            <img
                              src={getAssetUrl(profile.logo_url) || ''}
                              alt="Partner logo"
                              className="h-full w-full object-contain rounded-lg"
                            />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{profile.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{profile.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={profile.status === 1 ? 'default' : 'destructive'}>
                          {profile.status_label}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(profile.kyc_status)}>
                          KYC: {profile.kyc_status_label}
                        </Badge>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">Agents</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">{statistics?.total_agents || 0}</p>
                        <p className="text-xs text-muted-foreground">
                          {statistics?.approved_agents || 0} approved
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Terminal className="h-4 w-4" />
                          <span className="text-sm">Terminals</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">{statistics?.total_terminals || 0}</p>
                        <p className="text-xs text-muted-foreground">assigned</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Documents</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold">{statistics?.total_documents || 0}</p>
                        <p className="text-xs text-muted-foreground">uploaded</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm">Permissions</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs">
                            <span className={profile.can_onboard_agents ? 'text-green-600' : 'text-muted-foreground'}>
                              {profile.can_onboard_agents ? '✓' : '✗'} Can onboard agents
                            </span>
                          </p>
                          <p className="text-xs">
                            <span className={profile.can_assign_terminals ? 'text-green-600' : 'text-muted-foreground'}>
                              {profile.can_assign_terminals ? '✓' : '✗'} Can assign terminals
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* KYC Info Summary */}
                    {kycProfile && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h4 className="text-sm font-medium mb-2">Business Category</h4>
                        <p className="text-sm text-muted-foreground">
                          {kycProfile.business_category_label}
                        </p>
                        {kycProfile.submitted_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {formatDate(kycProfile.submitted_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Latest Review */}
                    {latestReview && (
                      <div className="rounded-lg border p-4">
                        <h4 className="text-sm font-medium mb-2">Latest KYC Review</h4>
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant={getStatusBadgeVariant(latestReview.decision)}>
                              {latestReview.decision_label}
                            </Badge>
                            {latestReview.remarks && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {latestReview.remarks}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{latestReview.reviewer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(latestReview.reviewed_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Info */}
                    <div className="text-xs text-muted-foreground">
                      <p>Account created: {formatDate(profile.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Failed to load profile information.</p>
                )}
              </CardContent>
            </Card>

            {/* KYC Business Profile Card - Read Only */}
            {kycProfile && kycProfile.data && Object.keys(kycProfile.data).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    KYC Business Information
                  </CardTitle>
                  <CardDescription>
                    Your submitted KYC business details. This information is read-only and was submitted during KYC verification.
                    <span className="block mt-1">
                      <Badge variant={getStatusBadgeVariant(profile?.kyc_status || '')}>
                        {profile?.kyc_status_label}
                      </Badge>
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(kycProfile.data).map(([key, value]) => {
                      // Check if value is a file URL
                      const isFileUrl = typeof value === 'string' && (
                        value.includes('/storage/') || 
                        value.includes('/uploads/') ||
                        value.endsWith('.pdf') ||
                        value.endsWith('.jpg') ||
                        value.endsWith('.png')
                      );

                      return (
                        <div key={key} className="space-y-1">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                            {key}
                          </Label>
                          {isFileUrl ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={getAssetUrl(value) || ''}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                View Document
                              </a>
                            </div>
                          ) : (
                            <p className="text-sm font-medium bg-muted/50 rounded px-3 py-2">
                              {value || 'N/A'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {kycProfile.submitted_at && (
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                      Submitted on {formatDate(kycProfile.submitted_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* KYC Documents Card */}
            {/* {settingsData?.kyc_documents && settingsData.kyc_documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    KYC Documents
                  </CardTitle>
                  <CardDescription>
                    Documents submitted for KYC verification.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {settingsData.kyc_documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.document_type}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {doc.status}
                          </Badge>
                          <a
                            href={getAssetUrl(doc.file_url) || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Edit Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your partner organization details.
                  {lockedFields.length > 0 && (
                    <span className="block mt-1 text-amber-600">
                      <Lock className="inline h-3 w-3 mr-1" />
                      Some fields are locked after KYC approval. Only description can be updated.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="partnerName">
                          Organization Name
                          {isFieldLocked('name') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        </Label>
                        <Input
                          id="partnerName"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          disabled={isFieldLocked('name')}
                          className={isFieldLocked('name') ? 'bg-muted' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerId">Partner Code</Label>
                        <Input
                          id="partnerId"
                          value={profile?.code || 'N/A'}
                          disabled
                          className="bg-muted font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail className="inline h-4 w-4 mr-1" />
                          Email
                          {isFieldLocked('email') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isFieldLocked('email')}
                          className={isFieldLocked('email') ? 'bg-muted' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="inline h-4 w-4 mr-1" />
                          Phone
                          {isFieldLocked('phone') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isFieldLocked('phone')}
                          className={isFieldLocked('phone') ? 'bg-muted' : ''}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Address
                        {isFieldLocked('address') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={isFieldLocked('address')}
                        className={isFieldLocked('address') ? 'bg-muted' : ''}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          City
                          {isFieldLocked('city') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        </Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isFieldLocked('city')}
                          className={isFieldLocked('city') ? 'bg-muted' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">
                          State
                          {isFieldLocked('state') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        </Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          disabled={isFieldLocked('state')}
                          className={isFieldLocked('state') ? 'bg-muted' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">
                          Country
                          {isFieldLocked('country') && <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />}
                        </Label>
                        <Input
                          id="country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          disabled={isFieldLocked('country')}
                          className={isFieldLocked('country') ? 'bg-muted' : ''}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of your organization..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        This field can always be updated, even after KYC approval.
                      </p>
                    </div>

                    <PermissionGate permission="settings.edit">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </PermissionGate>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <div className="space-y-6">
            {/* Branding Images Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Branding Images
                </CardTitle>
                <CardDescription>
                  Upload your logo, favicon, and background images.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Partner Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                      {settingsData?.branding?.logo_url ? (
                        <img
                          src={getAssetUrl(settingsData.branding.logo_url) || ''}
                          alt="Partner logo"
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('logo', file);
                        }}
                      />
                      <PermissionGate permission="settings.edit">
                        <Button 
                          variant="outline" 
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploadingImages}
                        >
                          {isUploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Upload Logo
                        </Button>
                      </PermissionGate>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 2MB. Formats: JPEG, PNG, GIF, SVG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dark Logo */}
                <div className="space-y-2">
                  <Label>Dark Mode Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-gray-800 flex items-center justify-center border-2 border-dashed border-border">
                      {settingsData?.branding?.logo_dark_url ? (
                        <img
                          src={getAssetUrl(settingsData.branding.logo_dark_url) || ''}
                          alt="Dark logo"
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={logoDarkInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('logo_dark', file);
                        }}
                      />
                      <PermissionGate permission="settings.edit">
                        <Button 
                          variant="outline" 
                          onClick={() => logoDarkInputRef.current?.click()}
                          disabled={isUploadingImages}
                        >
                          {isUploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Upload Dark Logo
                        </Button>
                      </PermissionGate>
                      <p className="text-xs text-muted-foreground mt-1">
                        Used when dark mode is enabled
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                      {settingsData?.branding?.favicon_url ? (
                        <img
                          src={getAssetUrl(settingsData.branding.favicon_url) || ''}
                          alt="Favicon"
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept="image/x-icon,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('favicon', file);
                        }}
                      />
                      <PermissionGate permission="settings.edit">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => faviconInputRef.current?.click()}
                          disabled={isUploadingImages}
                        >
                          {isUploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          Upload Favicon
                        </Button>
                      </PermissionGate>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 512KB. Formats: ICO, PNG
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primary & Accent Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Primary & Accent Colors
                </CardTitle>
                <CardDescription>
                  Main brand colors used throughout the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.primary_color || '#6576ff'}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.primary_color || '#6576ff'}
                        onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Dark Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.primary_dark_color || '#4a5bd9'}
                        onChange={(e) => setBranding({ ...branding, primary_dark_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.primary_dark_color || '#4a5bd9'}
                        onChange={(e) => setBranding({ ...branding, primary_dark_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Light Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.primary_light_color || '#e0e4ff'}
                        onChange={(e) => setBranding({ ...branding, primary_light_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.primary_light_color || '#e0e4ff'}
                        onChange={(e) => setBranding({ ...branding, primary_light_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.secondary_color || '#364a63'}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.secondary_color || '#364a63'}
                        onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.accent_color || '#1ee0ac'}
                        onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.accent_color || '#1ee0ac'}
                        onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Colors</CardTitle>
                <CardDescription>
                  Customize the sidebar appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sidebar Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.sidebar_bg_color || '#1c2b46'}
                        onChange={(e) => setBranding({ ...branding, sidebar_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.sidebar_bg_color || '#1c2b46'}
                        onChange={(e) => setBranding({ ...branding, sidebar_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sidebar Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.sidebar_text_color || '#b7c2d0'}
                        onChange={(e) => setBranding({ ...branding, sidebar_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.sidebar_text_color || '#b7c2d0'}
                        onChange={(e) => setBranding({ ...branding, sidebar_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Active Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.sidebar_active_bg_color || '#101924'}
                        onChange={(e) => setBranding({ ...branding, sidebar_active_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.sidebar_active_bg_color || '#101924'}
                        onChange={(e) => setBranding({ ...branding, sidebar_active_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Active Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.sidebar_active_text_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, sidebar_active_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.sidebar_active_text_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, sidebar_active_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hover Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.sidebar_hover_bg_color || '#253a57'}
                        onChange={(e) => setBranding({ ...branding, sidebar_hover_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.sidebar_hover_bg_color || '#253a57'}
                        onChange={(e) => setBranding({ ...branding, sidebar_hover_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Header & Body Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Header & Body Colors</CardTitle>
                <CardDescription>
                  Customize header, body, and card backgrounds.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Header Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.header_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, header_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.header_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, header_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Header Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.header_text_color || '#364a63'}
                        onChange={(e) => setBranding({ ...branding, header_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.header_text_color || '#364a63'}
                        onChange={(e) => setBranding({ ...branding, header_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Body Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.body_bg_color || '#f5f6fa'}
                        onChange={(e) => setBranding({ ...branding, body_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.body_bg_color || '#f5f6fa'}
                        onChange={(e) => setBranding({ ...branding, body_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Card Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.card_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, card_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.card_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, card_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Card Border</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.card_border_color || '#e5e9f2'}
                        onChange={(e) => setBranding({ ...branding, card_border_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.card_border_color || '#e5e9f2'}
                        onChange={(e) => setBranding({ ...branding, card_border_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Button Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Button Colors</CardTitle>
                <CardDescription>
                  Customize button styles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Primary Button BG</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.btn_primary_bg_color || '#6576ff'}
                        onChange={(e) => setBranding({ ...branding, btn_primary_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.btn_primary_bg_color || '#6576ff'}
                        onChange={(e) => setBranding({ ...branding, btn_primary_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Button Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.btn_primary_text_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, btn_primary_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.btn_primary_text_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, btn_primary_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Button Hover</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.btn_primary_hover_bg_color || '#5664d2'}
                        onChange={(e) => setBranding({ ...branding, btn_primary_hover_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.btn_primary_hover_bg_color || '#5664d2'}
                        onChange={(e) => setBranding({ ...branding, btn_primary_hover_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Secondary Button BG</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.btn_secondary_bg_color || '#e5e9f2'}
                        onChange={(e) => setBranding({ ...branding, btn_secondary_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.btn_secondary_bg_color || '#e5e9f2'}
                        onChange={(e) => setBranding({ ...branding, btn_secondary_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Button Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.btn_secondary_text_color || '#526484'}
                        onChange={(e) => setBranding({ ...branding, btn_secondary_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.btn_secondary_text_color || '#526484'}
                        onChange={(e) => setBranding({ ...branding, btn_secondary_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text & Link Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Text & Link Colors</CardTitle>
                <CardDescription>
                  Customize text and link appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Primary Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.text_primary_color || '#364a63'}
                        onChange={(e) => setBranding({ ...branding, text_primary_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.text_primary_color || '#364a63'}
                        onChange={(e) => setBranding({ ...branding, text_primary_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.text_secondary_color || '#8094ae'}
                        onChange={(e) => setBranding({ ...branding, text_secondary_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.text_secondary_color || '#8094ae'}
                        onChange={(e) => setBranding({ ...branding, text_secondary_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Muted Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.text_muted_color || '#b7c2d0'}
                        onChange={(e) => setBranding({ ...branding, text_muted_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.text_muted_color || '#b7c2d0'}
                        onChange={(e) => setBranding({ ...branding, text_muted_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Link Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.link_color || '#6576ff'}
                        onChange={(e) => setBranding({ ...branding, link_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.link_color || '#6576ff'}
                        onChange={(e) => setBranding({ ...branding, link_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Link Hover Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.link_hover_color || '#5664d2'}
                        onChange={(e) => setBranding({ ...branding, link_hover_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.link_hover_color || '#5664d2'}
                        onChange={(e) => setBranding({ ...branding, link_hover_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status Colors</CardTitle>
                <CardDescription>
                  Colors for success, warning, danger, and info states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Success</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.success_color || '#1ee0ac'}
                        onChange={(e) => setBranding({ ...branding, success_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.success_color || '#1ee0ac'}
                        onChange={(e) => setBranding({ ...branding, success_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Warning</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.warning_color || '#f4bd0e'}
                        onChange={(e) => setBranding({ ...branding, warning_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.warning_color || '#f4bd0e'}
                        onChange={(e) => setBranding({ ...branding, warning_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Danger</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.danger_color || '#e85347'}
                        onChange={(e) => setBranding({ ...branding, danger_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.danger_color || '#e85347'}
                        onChange={(e) => setBranding({ ...branding, danger_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Info</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.info_color || '#09c2de'}
                        onChange={(e) => setBranding({ ...branding, info_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.info_color || '#09c2de'}
                        onChange={(e) => setBranding({ ...branding, info_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={branding.border_color || '#e5e9f2'}
                      onChange={(e) => setBranding({ ...branding, border_color: e.target.value })}
                      className="h-10 w-14 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.border_color || '#e5e9f2'}
                      onChange={(e) => setBranding({ ...branding, border_color: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login & Footer Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Login & Footer Colors</CardTitle>
                <CardDescription>
                  Customize login page and footer appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Login Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.login_bg_color || '#f5f6fa'}
                        onChange={(e) => setBranding({ ...branding, login_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.login_bg_color || '#f5f6fa'}
                        onChange={(e) => setBranding({ ...branding, login_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Login Card Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.login_card_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, login_card_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.login_card_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, login_card_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Footer Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.footer_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, footer_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.footer_bg_color || '#ffffff'}
                        onChange={(e) => setBranding({ ...branding, footer_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.footer_text_color || '#8094ae'}
                        onChange={(e) => setBranding({ ...branding, footer_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.footer_text_color || '#8094ae'}
                        onChange={(e) => setBranding({ ...branding, footer_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dark Mode Colors Card */}
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Colors</CardTitle>
                <CardDescription>
                  Customize dark mode appearance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Dark Mode Background</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.dark_mode_bg_color || '#101924'}
                        onChange={(e) => setBranding({ ...branding, dark_mode_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.dark_mode_bg_color || '#101924'}
                        onChange={(e) => setBranding({ ...branding, dark_mode_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dark Mode Card BG</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.dark_mode_card_bg_color || '#1c2b46'}
                        onChange={(e) => setBranding({ ...branding, dark_mode_card_bg_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.dark_mode_card_bg_color || '#1c2b46'}
                        onChange={(e) => setBranding({ ...branding, dark_mode_card_bg_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dark Mode Text</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={branding.dark_mode_text_color || '#b7c2d0'}
                        onChange={(e) => setBranding({ ...branding, dark_mode_text_color: e.target.value })}
                        className="h-10 w-14 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.dark_mode_text_color || '#b7c2d0'}
                        onChange={(e) => setBranding({ ...branding, dark_mode_text_color: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography & Styling Card */}
            <Card>
              <CardHeader>
                <CardTitle>Typography & Styling</CardTitle>
                <CardDescription>
                  Font and general styling options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Input
                      value={branding.font_family || 'Nunito, sans-serif'}
                      onChange={(e) => setBranding({ ...branding, font_family: e.target.value })}
                      placeholder="Nunito, sans-serif"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Size Base</Label>
                    <Input
                      value={branding.font_size_base || '14px'}
                      onChange={(e) => setBranding({ ...branding, font_size_base: e.target.value })}
                      placeholder="14px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Border Radius</Label>
                    <Input
                      value={branding.border_radius || '4px'}
                      onChange={(e) => setBranding({ ...branding, border_radius: e.target.value })}
                      placeholder="4px"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Box Shadow</Label>
                  <Input
                    value={branding.box_shadow || '0 1px 3px rgba(0,0,0,0.1)'}
                    onChange={(e) => setBranding({ ...branding, box_shadow: e.target.value })}
                    placeholder="0 1px 3px rgba(0,0,0,0.1)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <PermissionGate permission="settings.edit">
                    <Button onClick={handleSaveBranding} disabled={isSavingBranding}>
                      {isSavingBranding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save All Branding
                        </>
                      )}
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="settings.edit">
                    <Button variant="outline" onClick={handleResetBranding} disabled={isResettingBranding}>
                      {isResettingBranding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset to Defaults
                        </>
                      )}
                    </Button>
                  </PermissionGate>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API & Webhook Configuration
              </CardTitle>
              <CardDescription>
                View your webhook configuration and hub settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={settingsData?.webhook?.webhook_url || 'Not configured'}
                  disabled
                  className="font-mono bg-muted"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  {settingsData?.webhook?.has_webhook_secret ? (
                    <span className="text-green-600">Webhook secret is configured</span>
                  ) : (
                    <span>No webhook secret configured</span>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Hub Settings</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Hub Status</p>
                    <Badge variant={settingsData?.hub_settings?.hub_enabled ? 'default' : 'secondary'} className="mt-1">
                      {settingsData?.hub_settings?.hub_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Agent Self-Registration</p>
                    <Badge variant={settingsData?.hub_settings?.agent_self_registration ? 'default' : 'secondary'} className="mt-1">
                      {settingsData?.hub_settings?.agent_self_registration ? 'Allowed' : 'Not Allowed'}
                    </Badge>
                  </div>
                </div>
                {settingsData?.hub_settings?.hub_url && (
                  <div className="space-y-2">
                    <Label>Hub URL</Label>
                    <Input
                      value={settingsData.hub_settings.hub_url}
                      disabled
                      className="font-mono bg-muted"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">API Documentation</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      For detailed API documentation and integration guides, contact your Xtrapay account manager.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security preferences for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Session Timeout</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically log out after 30 minutes of inactivity.
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Login History</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    View recent login activity for your account.
                  </p>
                </div>
                <Button variant="outline">View History</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
