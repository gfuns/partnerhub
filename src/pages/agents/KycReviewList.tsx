import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileCheck, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { kycService } from '@/services/api/kyc.service';
import { KycSubmissionListItem, KycReviewStatus, KYC_REVIEW_STATUS_CONFIG, BusinessType } from '@/types/kyc';

export default function KycReviewList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<KycSubmissionListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, pageSize, searchQuery, statusFilter, businessTypeFilter]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await kycService.getSubmissions({
        page: currentPage,
        per_page: pageSize,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as KycReviewStatus) : undefined,
        business_type: businessTypeFilter !== 'all' ? (businessTypeFilter as BusinessType) : undefined,
      });
      
      setSubmissions(response.data || []);
      setTotalItems(response.meta.total || 0);
      setTotalPages(response.meta.last_page || 0);
    } catch (error) {
      setSubmissions([]);
      setTotalItems(0);
      setTotalPages(0);
      toast({
        title: 'Error',
        description: 'Failed to load KYC submissions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBusinessTypeLabel = (type: BusinessType) => {
    const labels: Record<BusinessType, string> = {
      individual: 'Individual',
      sme: 'SME',
      corporate: 'Corporate',
    };
    return labels[type] || type;
  };

  const columns = [
    {
      key: 'agent_code',
      header: 'Agent Code',
      render: (item: KycSubmissionListItem) => (
        <span className="font-mono text-sm">{item.agent.code}</span>
      ),
    },
    {
      key: 'business_name',
      header: 'Business Name',
      render: (item: KycSubmissionListItem) => (
        <span className="font-medium">{item.agent.business_name}</span>
      ),
    },
    {
      key: 'business_type',
      header: 'Business Type',
      render: (item: KycSubmissionListItem) => (
        <Badge variant="outline" className="capitalize">
          {getBusinessTypeLabel(item.business_type)}
        </Badge>
      ),
    },
    {
      key: 'documents',
      header: 'Documents',
      render: (item: KycSubmissionListItem) => {
        const totalDocs = item.documents.length;
        const uploadedDocs = item.documents.filter(d => d.status !== 'not_uploaded').length;
        return (
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {uploadedDocs}/{totalDocs}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: KycSubmissionListItem) => {
        // Derive status from submission data if not provided
        const status = item.status || (item.submitted_at ? 'submitted' : 'pending') as KycReviewStatus;
        const config = KYC_REVIEW_STATUS_CONFIG[status] || {
          label: 'Unknown',
          variant: 'secondary',
          description: 'Unknown status',
        };
        return (
          <Badge variant={config.variant as any} className="capitalize">
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      render: (item: KycSubmissionListItem) => (
        <span className="text-sm">
          {new Date(item.submitted_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-32',
      render: (item: KycSubmissionListItem) => {
        const status = item.status || (item.submitted_at ? 'submitted' : 'pending') as KycReviewStatus;
        return (
          <div className="flex items-center gap-1">
            <ActionButton
              icon={FileCheck}
              label={status === 'submitted' ? 'Start Review' : 'View Review'}
              onClick={() => navigate(`/kyc-review/agents/${item.id}`)}
            />
          </div>
        );
      },
    },
  ];

  const displayCount = statusFilter !== 'all' 
    ? `${totalItems} ${statusFilter.replace('_', ' ')} submission${totalItems !== 1 ? 's' : ''}` 
    : `${totalItems} submission${totalItems !== 1 ? 's' : ''}`;

  if (isLoading && submissions.length === 0) {
    return (
      <div>
        <PageHeader
          title="KYC Review"
          description="Review and approve agent KYC applications."
        />
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="KYC Review"
        description={`Review and approve agent KYC applications. ${displayCount}.`}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by agent code or business name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        {/* <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="needs_correction">Needs Correction</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select> */}
        {/* <Select value={businessTypeFilter} onValueChange={(value) => {
          setBusinessTypeFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Business Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Business Types</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="sme">SME</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
          </SelectContent>
        </Select> */}
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        emptyMessage="No KYC submissions found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
