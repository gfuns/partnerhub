import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TicketMessage, TicketAttachment } from '@/types/support';
import { useAuth } from '@/contexts/AuthContext';

interface MessageTimelineProps {
  messages: TicketMessage[];
  currentUserType: 'agent' | 'partner' | 'xtrapay';
  showInternalNotes?: boolean;
  isLoading?: boolean;
}

export function MessageTimeline({ 
  messages, 
  currentUserType, 
  showInternalNotes = false,
  isLoading = false
}: MessageTimelineProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getAssetUrl } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = messages.filter(msg => {
    if (msg.is_internal && !showInternalNotes) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredMessages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No messages yet
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto p-4">
      {filteredMessages.map((message) => {
        const isOwnMessage = message.sender_type === currentUserType;
        const isInternal = message.is_internal;

        return (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              isOwnMessage ? 'flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'max-w-[75%] rounded-lg p-3',
                isInternal
                  ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                  : isOwnMessage
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'text-xs font-medium',
                  isOwnMessage && !isInternal ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}>
                  {message.sender_name}
                  {isInternal && (
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">(Internal Note)</span>
                  )}
                </span>
                <span className={cn(
                  'text-xs',
                  isOwnMessage && !isInternal ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                )}>
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
              <p className={cn(
                'text-sm whitespace-pre-wrap',
                isOwnMessage && !isInternal ? 'text-primary-foreground' : ''
              )}>
                {message.message}
              </p>
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={getAssetUrl(attachment.file_url) || attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center gap-1 rounded px-2 py-1 text-xs',
                        isOwnMessage && !isInternal
                          ? 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                          : 'bg-background hover:bg-accent'
                      )}
                    >
                      <Paperclip className="h-3 w-3" />
                      {attachment.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageComposerProps {
  onSend: (message: string, attachments: File[], isInternal: boolean) => Promise<void>;
  placeholder?: string;
  showInternalToggle?: boolean;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  placeholder = 'Type your message...',
  showInternalToggle = false,
  disabled = false,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    
    try {
      setIsSending(true);
      await onSend(message.trim(), attachments, isInternal);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t p-4 space-y-3">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showInternalToggle && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-muted-foreground">Internal note (not visible to agent)</span>
        </label>
      )}

      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          className="min-h-[60px] resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
