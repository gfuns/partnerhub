import { useState } from 'react';
import { FileText, Download, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { kycService } from '@/services/api/kyc.service';
import { KycSubmissionDocument, DocumentStatus } from '@/types/kyc';

interface DocumentReviewCardProps {
  document: KycSubmissionDocument;
  profileId: string;
  onReviewComplete: () => void;
  isReadOnly?: boolean;
}

export function DocumentReviewCard({ document, profileId, onReviewComplete, isReadOnly = false }: DocumentReviewCardProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<DocumentStatus>(document.status);
  const [comment, setComment] = useState(document.rejection_reason || '');

  const handleReview = async () => {
    // Validate that comment is required for rejection or needs_correction
    if ((reviewStatus === 'rejected' || reviewStatus === 'needs_correction') && !comment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please provide a comment explaining why this document was rejected or needs correction.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await kycService.reviewDocument(profileId, document.id, {
        status: reviewStatus as 'approved' | 'rejected' | 'needs_correction',
        comment: comment.trim() || undefined,
      });

      toast({
        title: 'Document Reviewed',
        description: `Document has been marked as ${reviewStatus.replace('_', ' ')}.`,
      });

      onReviewComplete();
    } catch (error: any) {
      toast({
        title: 'Review Failed',
        description: error.response?.data?.message || 'Failed to submit document review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleDownload = async () => {
  //   try {
  //     const response = await kycService.downloadDocument(document.id);
  //     // Use the download_url from the response
  //     const a = window.document.createElement('a');
  //     a.href = response.data.download_url;
  //     a.download = response.data.file_name || document.document_name || `${document.document_type}_${document.id}`;
  //     a.target = '_blank';
  //     window.document.body.appendChild(a);
  //     a.click();
  //     window.document.body.removeChild(a);
  //   } catch (error) {
  //     toast({
  //       title: 'Download Failed',
  //       description: 'Failed to download document',
  //       variant: 'destructive',
  //     });
  //   }
  // };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_correction':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const variants: Record<DocumentStatus, string> = {
      not_uploaded: 'secondary',
      pending: 'outline',
      approved: 'default',
      verified: 'default',
      rejected: 'destructive',
      needs_correction: 'secondary',
    };

    return (
      <Badge variant={variants[status] as any} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      valid_id: 'Valid ID',
      utility_bill: 'Utility Bill',
      passport_photo: 'Passport Photo',
      cac_certificate: 'CAC Certificate',
      cac_form_co7: 'CAC Form CO7',
      memorandum: 'Memorandum & Articles',
      board_resolution: 'Board Resolution',
      director_id: 'Director ID',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(document.status)}
            <div>
              <CardTitle className="text-lg">{getDocumentTypeLabel(document.document_type)}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {document.document_name || `${document.document_type}_${document.id}`}
                </span>
                <span className="text-xs text-muted-foreground">({formatFileSize(document.file_size)})</span>
              </div>
            </div>
          </div>
          {getStatusBadge(document.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Uploaded: {document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : new Date(document.created_at).toLocaleString()}</span>
          {document.verified_at && (
            <>
              <span>•</span>
              <span>Reviewed: {new Date(document.verified_at).toLocaleString()}</span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(document.file_url, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {/* <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button> */}
        </div>

        {!isReadOnly && document.status === 'pending' && (
          <>
            <div className="space-y-2">
              <Label>Review Decision</Label>
              <RadioGroup value={reviewStatus} onValueChange={(value) => setReviewStatus(value as DocumentStatus)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="verified" id={`${document.id}-approved`} />
                  <Label htmlFor={`${document.id}-approved`} className="font-normal cursor-pointer">
                    Approve - Document is valid and complete
                  </Label>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <RadioGroupItem value="needs_correction" id={`${document.id}-correction`} />
                  <Label htmlFor={`${document.id}-correction`} className="font-normal cursor-pointer">
                    Needs Correction - Document has issues that can be fixed
                  </Label>
                </div> */}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rejected" id={`${document.id}-rejected`} />
                  <Label htmlFor={`${document.id}-rejected`} className="font-normal cursor-pointer">
                    Reject - Document is invalid or fraudulent
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${document.id}-comment`}>
                Comment {(reviewStatus === 'rejected' || reviewStatus === 'needs_correction') && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Textarea
                id={`${document.id}-comment`}
                placeholder="Add your review comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleReview}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </>
        )}

        {document.rejection_reason && (
          <div className="space-y-2 border-t pt-4">
            <Label>Reviewer Comment</Label>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {document.rejection_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
