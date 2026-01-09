import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, FileCheck, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ActionButton } from '@/components/ActionButton';
import { TablePagination } from '@/components/TablePagination';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KycStatus, AgentWithKyc } from '@/types/kyc';

const mockAgentsWithKyc: AgentWithKyc[] = [
  {
    id: '1',
    businessName: 'ABC Enterprises',
    contactName: 'John Doe',
    phone: '+234 801 234 5678',
    email: 'john@abc.com',
    terminals: 0,
    kycStatus: 'pending_review',
    kycSubmission: {
      businessType: 'registered_business',
      fullName: 'John Doe',
      phoneNumber: '+234 801 234 5678',
      email: 'john@abc.com',
      businessName: 'ABC Enterprises',
      cacNumber: 'RC123456',
      directorIdUrl: 'https://storage.example.com/id.pdf',
      businessAddressProofUrl: 'https://storage.example.com/address.pdf',
      declarationAccepted: true,
      submittedAt: '2024-01-15T10:30:00Z',
    },
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    businessName: 'Quick Mart',
    contactName: 'Mike Johnson',
    phone: '+234 803 456 7890',
    email: 'mike@quickmart.com',
    terminals: 0,
    kycStatus: 'pending_onboarding',
    createdAt: '2024-01-14',
  },
  {
    id: '3',
    businessName: 'XYZ Holdings',
    contactName: 'Jane Smith',
    phone: '+234 802 345 6789',
    email: 'jane@xyz.com',
    terminals: 5,
    kycStatus: 'approved',
    createdAt: '2024-01-10',
  },
  {
    id: '4',
    businessName: 'Delta Services',
    contactName: 'Sarah Brown',
    phone: '+234 804 567 8901',
    email: 'sarah@delta.com',
    terminals: 0,
    kycStatus: 'rejected',
    rejectionReason: 'Invalid business registration documents',
    createdAt: '2024-01-08',
  },
  {
    id: '5',
    businessName: 'Prime Store',
    contactName: 'David Wilson',
    phone: '+234 805 678 9012',
    email: 'david@prime.com',
    terminals: 0,
    kycStatus: 'pending_review',
    kycSubmission: {
      businessType: 'individual_trader',
      fullName: 'David Wilson',
      phoneNumber: '+234 805 678 9012',
      email: 'david@prime.com',
      governmentIdUrl: 'https://storage.example.com/id.pdf',
      passportPhotoUrl: 'https://storage.example.com/photo.jpg',
      declarationAccepted: true,
      submittedAt: '2024-01-12T14:20:00Z',
    },
    createdAt: '2024-01-12',
  },
];

const KYC_STATUS_CONFIG: Record<KycStatus, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_onboarding: { label: 'Pending Onboarding', icon: Clock, variant: 'secondary' },
  pending_review: { label: 'Pending Review', icon: FileCheck, variant: 'default' },
  approved: { label: 'Approved', icon: CheckCircle, variant: 'outline' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' },
  suspended: { label: 'Suspended', icon: AlertTriangle, variant: 'destructive' },
};

function KycStatusBadge({ status }: { status: KycStatus }) {
  const config = KYC_STATUS_CONFIG[status];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function KycReviewList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAgents = mockAgentsWithKyc.filter((agent) => {
    const matchesSearch =
      agent.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.kycStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAgents.length / pageSize);
  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      key: 'businessName',
      header: 'Business Name',
      render: (item: AgentWithKyc) => (
        <span className="font-medium">{item.businessName}</span>
      ),
    },
    { key: 'contactName', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    {
      key: 'kycStatus',
      header: 'KYC Status',
      render: (item: AgentWithKyc) => <KycStatusBadge status={item.kycStatus} />,
    },
    { key: 'createdAt', header: 'Created' },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (item: AgentWithKyc) => (
        <div className="flex items-center gap-1">
          {item.kycStatus === 'pending_review' && (
            <ActionButton
              icon={FileCheck}
              label="Review KYC"
              onClick={() => navigate(`/agents/${item.id}/kyc-review`)}
            />
          )}
          <ActionButton
            icon={Eye}
            label="View Agent"
            onClick={() => navigate(`/agents/${item.id}`)}
          />
        </div>
      ),
    },
  ];

  const pendingReviewCount = mockAgentsWithKyc.filter(a => a.kycStatus === 'pending_review').length;

  return (
    <div>
      <PageHeader
        title="KYC Review"
        description={`Review and approve agent KYC applications. ${pendingReviewCount} pending review.`}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_onboarding">Pending Onboarding</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={paginatedAgents}
        emptyMessage="No agents found"
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredAgents.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
